import { Request, Response } from "express-serve-static-core";
import mongoose, { Types } from "mongoose";
import { Chat } from "../models/chat.model";
import { FriendRequest } from "../models/friendRequest.model";
import { User } from "../models/user.model";
import { FriendRequestRequest } from "../types/Request/types";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { emitEvent } from "../utils/emitEvent";

interface MulterRequest extends Request {
  files: {
    avatar: Express.Multer.File[];
  };
}
const generateAccessAndRefereshTokens = async (userId: string) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { fullName, email, userName, password } = req.body;

    const existedUser = await User.findOne({
      $or: [{ userName }, { email }],
    });

    if (existedUser) {
      throw new ApiError(409, "User with email or userName already exists");
    }

    const file = req.file;

    if (!file) {
      throw new ApiError(400, "Avatar file is required");
    }

    const results = await uploadOnCloudinary([file]);
    if (!results || results.length === 0) {
      throw new ApiError(500, "File upload to Cloudinary failed");
    }

    const newUser = {
      fullName,
      userName,
      email,
      password,
      avatar: {
        publicId: results[0].publicId,
        url: results[0].url,
      },
    };

    const user = await User.create(newUser);

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, createdUser, "User registered Successfully"));
  }
);

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  const user = await User.findOne({
    $or: [{ userName: identifier }, { email: identifier }],
  }).select("+password");

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id as string
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          //   accessToken,
          //   refreshToken,
        },
        "User logged In Successfully"
      )
    );
});
export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});
export const getMyProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const myProfile = await User.findById(req.user?._id).select(
      "-password -refreshToken"
    );
    return res
      .status(200)
      .json(new ApiResponse(200, myProfile, "User fetched successfully"));
  }
);

export const searchUser = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.query;
  if (!name) {
    return res.status(200).json(new ApiError(400, "Name is required"));
  }
  const myChats = await Chat.find({
    isGroupChat: false,
    members: { $in: [req.user?._id.toString()] },
  });

  const myChatsIDs = myChats.map((chat) => chat.members).flat();
  const users = await User.find({
    $or: [
      { fullName: { $regex: name, $options: "i" } },
      { userName: { $regex: name, $options: "i" } },
      { email: { $regex: name, $options: "i" } },
    ],
    _id: { $nin: myChatsIDs },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, users, "User fetched successfully"));
});
export const sendRequest = asyncHandler(async (req: Request, res: Response) => {
  const { receiverId } = req.body;
  if (!receiverId) {
    return res.status(400).json({
      success: false,
      message: "Invalid request",
    });
  }

  const isAlreadyFriendRequestSent = await FriendRequest.findOne({
    sender: req.user?._id,
    receiver: receiverId,
  });

  if (isAlreadyFriendRequestSent) {
    return res.status(400).json({
      success: false,
      message: "Request already sent",
    });
  }
  const myChats = await Chat.find({
    members: { $all: [req.user?._id.toString(), receiverId] },
    isGroupChat: false,
  })
  
  if (myChats.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Already in a chat",
    });
  }
  const request = await FriendRequest.create({
    sender: req.user?._id,
    receiver: receiverId,
  });

  const notification = {
    ...request,
    sender: {
       _id: req.user?._id,
      fullName: req.user?.fullName,
      userName: req.user?.userName,
     },
     receiver: {
       _id: receiverId,
      fullName: "",
      userName: "",
     },
  }

  // console.log("notification", notification);

  emitEvent(req, "NEW_REQUEST", [receiverId], {
    title: "New friend request",
    description: `${req.user?.fullName} sent you a friend request`,
    notification: notification,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, request, "Request sent successfully"));
});
export const acceptRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { requestId, status } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    if (!status || (status !== "accepted" && status !== "rejected")) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    const request = (await FriendRequest.findById(requestId)
      .populate("sender", "fullName userName")
      .populate(
        "receiver",
        "fullName userName"
      )) as unknown as FriendRequestRequest;
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (request.receiver._id.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to accept this request",
      });
    }

    if (status === "accepted") {
      const member = [request.sender._id, request.receiver._id];

      await Promise.all([
        Chat.create({
          members: member,
          chatName: `${request.sender.fullName}-${request.receiver.fullName}`,
        }),

        FriendRequest.findByIdAndDelete(requestId),
      ]);

      // emitEvent(req, "REFATCH_CHAT", member, "");

      return res.status(200).json({
        success: true,
        senderId: request.sender._id,
        message: "Request accepted successfully",
      });
    }

    if (status === "rejected") {
      await FriendRequest.findByIdAndDelete(requestId);

      return res
        .status(200)
        .json(new ApiResponse(200, request, "Request rejected successfully"));
    }

    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid request status"));
  }
);
export const getNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?._id) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    if (!mongoose.isValidObjectId(req.user._id)) {
      throw new Error("Invalid userId");
    }

    // console.log("req.user._id.toString()" , req.user._id.toString());
    // console.log(req.user._id.toString() as string === "66d5facd181a042918f16e5b");
    // console.log("66d5facd181a042918f16e5b" === "66d5facd181a042918f16e5b");

    const notifications = await FriendRequest.find({
      receiver: req.user._id.toString(),
    })
      .populate("sender", "fullName userName")
      .populate("receiver", "fullName userName");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          notifications,
          "Notifications fetched successfully"
        )
      );
  }
);
