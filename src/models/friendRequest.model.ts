import { Document, model, Schema } from "mongoose";

interface FriendRequest extends Document {
    sender: Schema.Types.ObjectId
    receiver: Schema.Types.ObjectId
    status: "pending" | "accepted" | "rejected"
}

const friendRequestShema = new Schema<FriendRequest>({
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }
}, {
    timestamps: true
});

export const FriendRequest = model<FriendRequest>("FriendRequest", friendRequestShema)