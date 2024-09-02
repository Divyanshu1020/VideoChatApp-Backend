import { Request, Response } from "express-serve-static-core";
import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

interface MulterRequest extends Request {
  files: {
    avatar: Express.Multer.File[];
  };
}
const generateAccessAndRefereshTokens = async (userId: string) => {
  try {
    const user  = await User.findById(userId);

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

    const avatarLocalPath = (req as MulterRequest).files?.avatar[0]?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
    }

    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // if (!avatar) {
    //     throw new ApiError(400, "Avatar file is required")
    // }

    const newUser = {
      fullName,
      userName,
      email,
      password,
      avatar: {
        publicId: "avatarLocalPath",
        url: "avatarLocalPath",
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
  const user  = await User.findOne({
    $or: [{ userName:identifier }, { email: identifier }],
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
export const logoutUser = asyncHandler(async(req: AuthenticatedRequest, res: Response) => {
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )


    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

})
export const getMyProfile = asyncHandler(async(req: AuthenticatedRequest, res: Response) => {
  
  return res
  .status(200)
  .json(new ApiResponse(200, req.user, "User fetched successfully"))
  

})
