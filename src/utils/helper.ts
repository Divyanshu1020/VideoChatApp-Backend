import { Schema } from "mongoose";
import { members } from "../types/Request/types";

export const getOtherMember = (
  members: members[],
  userId: Schema.Types.ObjectId | undefined
) => {
  return members.find((member) => member._id.toString() !== userId?.toString());
};
