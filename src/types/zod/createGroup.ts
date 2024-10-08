import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string({
      required_error: "Please enter group name.",
    })
    .min(3, {
      message: "Group name must be at least 3 characters long.",
    })
    .max(20, {
      message: "Group name must be at most 20 characters long.",
    }),
  bio: z
    .string({
      required_error: "Please enter group description.",
    })
    .min(3, {
      message: "Group description must be at least 3 characters long.",
    })
    .max(100, {
      message: "Group description must be at most 100 characters long.",
    })
    .optional(),
  members: z.array(z.string({ required_error: "Please add members." })).min(2, {
    message: "Please add atleast 2 members.",
  }),
});
