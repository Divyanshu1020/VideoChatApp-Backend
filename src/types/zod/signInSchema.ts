import { z } from "zod";

export const signInSchema = z.object({
  identifier: z.string({
    required_error: "Please enter your email or username.",
  }),
  password: z.string({
    required_error: "Please enter your password.",
  }),
});
