import { Schema } from "mongoose"

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