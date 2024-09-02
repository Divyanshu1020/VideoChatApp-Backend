import { NextFunction, Request, Response } from "express-serve-static-core";
import jwt from "jsonwebtoken";
import { AccessToken, User } from "../models/user.model";
import { UserRequest } from "../types/Request/user";
import { ApiError } from "../utils/apiError";
import asyncHandler from "../utils/asyncHandler";

export interface AuthenticatedRequest extends Request {
    user?: UserRequest;
}

export const verifyJWT = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token: string | undefined =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        throw new ApiError(401, "Unauthorized request");
      }

      const decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!
      ) as AccessToken;

      const user: UserRequest | null = await User.findById(
        decodedToken?._id
      ).select("-password -refreshToken");

      if (!user) {
        throw new ApiError(401, "Invalid Access Token");
      }

      req.user = user;
      next();
    } catch (error: any) {
      throw new ApiError(401, error?.message || "Invalid access token");
    }
  }
);
