import { Document, model, Schema } from "mongoose";

export interface Chat extends Document {
    chatName: string;
    isGroupChat: boolean;
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
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
}, {
    timestamps: true
});

export const Chat = model<Chat>("Chat", chatShema);