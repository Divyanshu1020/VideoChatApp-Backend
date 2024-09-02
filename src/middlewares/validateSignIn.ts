import { Request, Response, NextFunction } from "express-serve-static-core";
import { z } from "zod";
import { signInSchema } from "../types/zod/signInSchema";

export const validateSignIn = (req : Request , res :Response, next: NextFunction) => {
    try {
      const validatedData = signInSchema.parse(req.body);
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