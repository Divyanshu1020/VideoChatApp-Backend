import { Document, model, Schema } from "mongoose";

export interface Message {
    sender: Schema.Types.ObjectId;
    content: string;
    chat: Schema.Types.ObjectId;
    media: {
        publicId: string;
        url: string;
    }
}

const messageShema = new Schema<Message>({
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
    },
    chat: {
        type: Schema.Types.ObjectId,
        ref: "Chat",
        required: true,
    },
    media: {
        publicId:{
            type: String,
            required: true,
        },
        url:{
            type: String,
            required: true,
        }
    }
}, {
    timestamps: true
});

export const Message = model<Message>("Message", messageShema)