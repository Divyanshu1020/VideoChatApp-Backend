import { Document, Schema } from "mongoose"

export interface UserRequest {
    _id: string | Schema.Types.ObjectId
    fullName: string
    userName: string
    email: string
    avatar: {
        publicId: string
        url: string
    }
    createdAt: Date
    updatedAt: Date
}

export type members = {
    _id: string | Schema.Types.ObjectId,
    fullName: string,
    userName: string
    avatar: {
        publicId: string
        url: string
    }
}
export interface myChatRequest {
    _id: string | Schema.Types.ObjectId
    chatName: string
    avatar: {
        publicId: string
        url: string
    }
    isGroupChat: boolean
    creator: string | Schema.Types.ObjectId
    members: members[]
}

export interface myGroupRequest {

    _id: string | Schema.Types.ObjectId
    avatar: {
        publicId: string
        url: string
    }
    chatName: string
    isGroupChat: true
    bio: string
    creator: string | Schema.Types.ObjectId
    members: members[]
}

export interface addMembersInGroupRequest {
    chatId : Schema.Types.ObjectId

    members : [{
        _id: Schema.Types.ObjectId,
        userName: string,
    }]
}

export interface removeMemberInGroupRequest {
    chatId : Schema.Types.ObjectId

    member : [{
        _id: Schema.Types.ObjectId,
        userName: string,
    }]
}

export interface leaveGroupRequesr{
    chatId : Schema.Types.ObjectId,
    newOwner? : {
        _id: Schema.Types.ObjectId,
        userName: string,
    }
}

export interface attachmentRequest {
    chatId : Schema.Types.ObjectId,
    content : string,
}

export interface getChatDetails{
    
    chatId : string
}

export interface FriendRequestRequest {
    _id: Schema.Types.ObjectId,
    sender: {
      _id: Schema.Types.ObjectId,
      fullName: string;
      userName: string;
    };
    receiver: {
      _id: Schema.Types.ObjectId,
      fullName: string;
      userName: string;
    };
  }




