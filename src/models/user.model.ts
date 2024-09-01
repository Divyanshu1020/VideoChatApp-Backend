import { Document, model, Schema } from "mongoose";

export interface User extends Document {
    name: string;
    userName: string;
    email: string;
    password: string;
    avatar: {
        publicId: string;
        url: string;
    };
}

const userSchema = new Schema<User>({
    name: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true
    },
    avatar: {
        publicId:{
            type: String,
            required: true,
        },
        url:{
            type: String,
            required: true,
        }
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
},{
    timestamps: true
});

export const User = model<User>("User", userSchema);