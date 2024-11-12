import { Request, Response } from "express-serve-static-core";
import { Schema } from "mongoose";
import { CreateGroupInput } from "../middlewares/validateCreateGroup";
import { Chat } from "../models/chat.model";
import { Message, MessageInterface } from "../models/message.model";
import {
  addMembersInGroupRequest,
  attachmentRequest,
  leaveGroupRequesr,
  myChatRequest,
  myGroupRequest,
  removeMemberInGroupRequest,
} from "../types/Request/types";
import { ApiError } from "../utils/apiError";
import asyncHandler from "../utils/asyncHandler";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary";
import { emitEvent } from "../utils/emitEvent";
import { getOtherMember } from "../utils/helper";

export const createGroup = asyncHandler(
  async (req: Request<{}, {}, CreateGroupInput>, res: Response) => {
    const { name, bio, members } = req.body;

    const allMembers = [...members, req.user?._id];

    const file = req.file;
    const avatar = {
      url: "",
      publicId: "",
    };

    if (file) {
      const results = await uploadOnCloudinary([file]);
      avatar.url = results[0].url;
      avatar.publicId = results[0].publicId;
      if (!results || results.length === 0) {
        throw new ApiError(500, "File upload to Cloudinary failed");
      }
    }

    await Chat.create({
      chatName: name,
      isGroupChat: true,
      creator: req.user?._id,
      members: allMembers,
      avatar: avatar,
      bio: bio,
    });

    emitEvent(req, "WELLCOME", members, {
      title: "Welcome",
      description: `You are added to new group ${name}`,
    });

    emitEvent(req, "REFETCH", allMembers, {});

    return res.status(200).json({
      success: true,
      message: "Group created successfully",
    });
  }
);

export const getMyChats = asyncHandler(async (req: Request, res: Response) => {
  const myChats = (await Chat.find({
    members: { $in: [req.user?._id] },
  }).populate("members", "fullName  avatar")) as unknown as myChatRequest[];

  // .populate("creator", "fullName userName email")

  const data = myChats.map((chat) => {
    const otherMembers = getOtherMember(chat.members, req.user?._id);

    return {
      _id: chat._id,
      chatName: chat.isGroupChat ? chat.chatName : otherMembers?.fullName,
      isGroupChat: chat.isGroupChat,
      members: chat.members.reduce((pre, cur) => {
        if (cur._id.toString() !== req.user?._id.toString()) {
          pre.push(cur._id.toString());
        }
        return pre;
      }, [] as string[]),
      avatar: chat.isGroupChat
        ? chat.members.slice(0, 3).map((member) => member.avatar.url)
        : [otherMembers?.avatar.url],
      groupDP: {
        url: chat?.avatar.url || "",
        publicId: chat?.avatar.publicId || "",
      },
    };
  });

  return res.status(200).json({
    success: true,
    data: data,
    message: "Fetched successfully",
  });
});

export const getMyGroups = asyncHandler(async (req: Request, res: Response) => {
  const myGroups = (await Chat.find({
    creator: req.user?._id,
    isGroupChat: true,
  }).populate("members", "fullName avatar")) as unknown as myGroupRequest[];

  const data = myGroups.map((group) => ({
    _id: group._id,
    chatName: group.chatName,
    isGroupChat: group.isGroupChat,
    bio: group.bio,
    avatar: group.avatar.url,
    members: group.members.length,
  }));

  return res.status(200).json({
    success: true,
    data: data,
    message: "Fetched successfully",
  });
});

export const addMembersInGroup = asyncHandler(
  async (req: Request<{}, {}, addMembersInGroupRequest>, res: Response) => {
    const { chatId, members } = req.body;

    if (!chatId || !members || members.length < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: "Not a group chat",
      });
    }

    if (chat.creator.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // const allMembersPromise = members.map((id : string) => User.findById(id, "userName"))

    // const allNewMembers = await Promise.all(allMembersPromise)

    // const allNewMembersUnique = allNewMembers.filter((i)=> !chat.members.includes(i._id.toString()))

    // chat.members.push(...allNewMembersUnique)

    // const allUserUserName = allNewMembers.map((member) => member.userName).join(", ")

    const allNewMembersUnique = members.filter(
      (member) => !chat.members.includes(member._id)
    );

    const allNewMembersId = allNewMembersUnique.map((member) => member._id);

    chat.members.push(...allNewMembersId);

    if (chat.members.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Group members cannot exceed 100",
      });
    }

    await chat.save();

    const allNewMembersUserName = allNewMembersUnique
      .map((member) => member.userName)
      .join(", ");

    emitEvent(req, "REFETCH", allNewMembersId, {});

    emitEvent(req, "WELLCOME", allNewMembersId, {
      title: "Welcome",
      description: `You are added to new group ${chat.chatName}`,
    });

    return res.status(200).json({
      success: true,
      allNewMembersUserName,
      message: "Members added successfully",
    });
  }
);
export const removeMemberInGroup = asyncHandler(
  async (req: Request<{}, {}, removeMemberInGroupRequest>, res: Response) => {
    const { chatId, member } = req.body;

    if (!chatId || !member) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: "Not a group chat",
      });
    }

    // Calculate the new number of members after removal
    const newMemberCount = chat.members.length - member.length;
    if (newMemberCount < 3) {
      return res.status(400).json({
        success: false,
        message: "Group members cannot be less than 3",
      });
    }

    if (chat.creator.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Filter out all members that are in the member array

    chat.members = chat.members.filter(
      (mem) =>
        !member.some((removeMember) => String(removeMember._id) === String(mem))
    );

    await chat.save();

    const socket = member.map((m) => m._id);

    emitEvent(req, "WELLCOME", socket, {
      title: "Welcome",
      description: `You are added to new group ${chat.chatName}`,
    });

    emitEvent(req, "REFETCH", socket, {});

    return res.status(200).json({
      success: true,
      message: `${member
        .map((m) => m.userName)
        .join(", ")} removed successfully`,
    });
  }
);
export const changeAvatarOfGroup = asyncHandler(
  async (req: Request, res: Response) => {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: "Not a group chat",
      });
    }

    if (chat.creator.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const file = req.file;

    if (!file) {
      throw new ApiError(400, "Avatar file is required");
    }

    const results = await uploadOnCloudinary([file]);
    if (!results || results.length === 0) {
      throw new ApiError(500, "File upload to Cloudinary failed");
    }

    await deleteOnCloudinary(chat.avatar.publicId, "image");

    chat.avatar.url = results[0].url;
    chat.avatar.publicId = results[0].publicId;

    await chat.save();

    // emitEvent(
    //   req,
    //   "AERT",
    //   chat.members,
    //   `${member.map(m => m.userName).join(', ')} has been removed from group`
    // );
    // emitEvent(req, "REFRESHCHAT", chat.members, "");

    return res.status(200).json({
      success: true,
      message: "Avatar changed successfully",
    });
  }
);
export const renameGroup = asyncHandler(async (req: Request, res: Response) => {
  const { chatId, name } = req.body;

  if (!chatId || !name) {
    return res.status(400).json({
      success: false,
      message: "Invalid request",
    });
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({
      success: false,
      message: "Chat not found",
    });
  }

  if (!chat.isGroupChat) {
    return res.status(400).json({
      success: false,
      message: "Not a group chat",
    });
  }

  if (chat.creator.toString() !== req.user?._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Not authorized",
    });
  }

  chat.chatName = name;
  await chat.save();

  // emitEvent(
  //   req,
  //   "ALERT",
  //   chat.members,
  //   `${req.user?.fullName} changed group name to ${name}`
  // );

  return res.status(200).json({
    success: true,
    message: `Group name changed successfully`,
  });
});

export const leaveGroup = asyncHandler(
  async (req: Request<{}, {}, leaveGroupRequesr>, res: Response) => {
    const { chatId } = req.body;
    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }
    if (!chat.isGroupChat) {
      return res.status(400).json({
        success: false,
        message: "Not a group chat",
      });
    }

    const otherMembers = chat.members.filter(
      (member) => member.toString() !== req.user?._id.toString()
    );

    if (otherMembers.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Group members cannot be less than 3",
      });
    }

    if (chat.creator.toString() === req.user?._id.toString()) {
      if (req.body.newOwner) {
        chat.creator = req.body.newOwner._id;

        // emitEvent(
        //   req,
        //   "ALERT",
        //   req.body.newOwner._id,
        //   `${req.body.newOwner} you has been owner of group ${chat.chatName}`
        // );
      } else {
        const randomMember = Math.floor(Math.random() * otherMembers.length);
        chat.creator = otherMembers[randomMember];
      }
    }

    chat.members = otherMembers;

    await chat.save();

    // emitEvent(
    //   req,
    //   "ALERT",
    //   otherMembers,
    //   `${req.user?.userName} you has been owner of group ${chat.chatName}`
    // );

    return res.status(200).json({
      success: true,
      message: `you remove successfully`,
    });
  }
);
export const attachment = asyncHandler(
  async (req: Request<{}, {}, attachmentRequest>, res: Response) => {
    const { chatId, content } = req.body;
    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const file = req.files || [];
    // console.log("file", file);
    if (Array.isArray(file) && file.length < 1) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }
    const attachments = (await uploadOnCloudinary(
      file as [Express.Multer.File]
    )) as { publicId: string; url: string }[];
    if (!attachments || attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const messageForRealTime = {
      sender: {
        _id: req.user?._id,
        name: req.user?.fullName,
      },
      chat: chatId,
      content: content,
      media: attachments,
    };

    const message = await Message.create({
      sender: req.user?._id,
      chatId: chatId,
      content: content,
      media: attachments,
    });

    emitEvent(req, "NEW_MESSAGE", chat.members, {
      message: messageForRealTime,
      chatId,
    });

    // emitEvent(req, "NEW_MESSAGE_ALERT", chat.members, { message });

    res.status(200).json({
      success: true,
      message,
    });
  }
);

export const getChatDetails = asyncHandler(
  async (req: Request, res: Response) => {
    if (req.query.populate === "true") {
      const chat = await Chat.findById(req.params.chatId).populate(
        "members",
        "fullName avatar userName"
      );
      if (!chat) {
        throw new ApiError(404, "Chat not found");
      }

      return res.status(200).json({
        success: true,
        data: chat,
      });
    } else {
      const chat = await Chat.findById(req.params.chatId);
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found",
        });
      }
      return res.status(200).json({
        success: true,
        data: chat,
      });
    }
  }
);

export const deleteChat = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
  const { chatId } = req.params;

  if (!chatId) {
    return res.status(400).json({
      success: false,
      message: "Invalid request",
    });
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: "Chat not found",
    });
  }

  if (
    chat.isGroupChat &&
    chat.creator.toString() !== req.user?._id.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: "Not authorized",
    });
  }

  if (!chat.isGroupChat && !chat.members.includes(req.user?._id)) {
    return res.status(403).json({
      success: false,
      message: "Not authorized",
    });
  }
});
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const { page = 1 } = req.query;
  const limit = 10;
  const skip = (Number(page) - 1) * limit;
  if (!chatId) {
    return res.status(400).json({
      success: false,
      message: "Invalid request",
    });
  }

  const [messages, count] = await Promise.all([
    Message.find({ chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "fullName avatar")
      .lean(),
    Message.countDocuments({ chatId }),
  ]);

  const totalPages = Math.ceil(count / limit);
  return res.status(200).json({
    success: true,
    data: messages.reverse(),
    totalPages,
  });
});
export const getAllFriends = asyncHandler(
  async (req: Request, res: Response) => {
    const { chatId } = req.body;

    const myChats = (await Chat.find({
      members: { $in: [req.user?._id] },
      isGroupChat: false,
    }).populate(
      "members",
      "fullName  avatar userName "
    )) as unknown as myChatRequest[];

    // .populate("creator", "fullName userName email")

    const friends = myChats.map((chat) => {
      const otherMembers = getOtherMember(chat.members, req.user?._id);

      return {
        _id: otherMembers?._id as Schema.Types.ObjectId,
        name: otherMembers?.fullName,
        userName: otherMembers?.userName,
        avatar: otherMembers?.avatar.url,
      };
    });

    if (chatId) {
      const chat = await Chat.findById(chatId);
      const avilableFriends = friends.filter((friend) => {
        return !chat?.members.includes(friend._id);
      });

      return res.status(200).json({
        success: true,
        data: avilableFriends,
        message: "Fetched successfully",
      });
    } else {
      return res.status(200).json({
        success: true,
        data: friends,
        message: "Fetched successfully",
      });
    }
  }
);
