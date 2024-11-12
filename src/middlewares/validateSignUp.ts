import { NextFunction, Request, Response } from "express-serve-static-core";
import { z } from "zod";
import { signUpSchema } from "../types/zod/signUpSchema";

export const validateSignUp = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = signUpSchema.parse(req.body);
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
