import mongoose, { Document, model, Schema } from "mongoose";

export interface Chat extends Document {
    chatName: string;
    isGroupChat: boolean;
    avatar: {
        publicId: string
        url: string
    };
    bio: string;
    creator: Schema.Types.ObjectId;
    members: Schema.Types.ObjectId[]
}

const chatShema = new Schema<Chat>({
    chatName: {
        type: String,
        trim: true
    },
    isGroupChat: {
        type: Boolean,
        default: false
    },
    avatar: {
        publicId: {
            type: String
        },
        url: {
            type: String
        }
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    bio: {
        type: String
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
}, {
    timestamps: true
});

export const Chat = mongoose.model<Chat>("Chat", chatShema);