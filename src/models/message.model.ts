import { Document, InferSchemaType, model, Schema } from "mongoose";

export interface MessageInterface {
  sender: Schema.Types.ObjectId;
  content: string;
  chatId: Schema.Types.ObjectId;
  media: [
    {
      publicId: string;
      url: string;
    }
  ];
}

const messageShema = new Schema<MessageInterface>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    media: [
      {
        publicId: {
          type: String,
          // required: true,
        },
        url: {
          type: String,
          // required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Message = model<MessageInterface>("Message", messageShema);
