import { Request, Response, NextFunction } from "express-serve-static-core";
import { z } from "zod";
import { createGroupSchema } from "../types/zod/createGroup";
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export const validateCreateGroup = (req : Request , res :Response, next: NextFunction) => {
    try {
      req.body.members = JSON.parse(req.body.members)
      const validatedData = createGroupSchema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors.map((err) => `${err.message}`),
        });
      }
      next(error);
    }
};