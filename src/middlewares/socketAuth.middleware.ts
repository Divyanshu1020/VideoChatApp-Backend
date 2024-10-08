import { NextFunction } from "express";
import { Socket } from "socket.io";
import { ApiError } from "../utils/apiError";
import { AccessToken } from "../models/user.model";
import jwt from "jsonwebtoken";

const parseSocketCookies = (socket: Socket): { [key: string]: string } => {
    const cookieHeader = socket.request.headers.cookie;
    if (!cookieHeader) return {};
  
    return cookieHeader.split(';').reduce((cookies, cookie) => {
      const parts = cookie.split('=');
      if (parts.length === 2) {
        cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim());
      }
      return cookies;
    }, {} as { [key: string]: string });
  };
  
 export const socketAuth = async (socket: Socket, next: (err?: Error) => void) => {
    try {
      const cookies = parseSocketCookies(socket);
      const token = cookies['accessToken'];
  
      if (!token) return next(new ApiError(401, "Unauthorized request"));
  
      const decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      ) as AccessToken;
  
      if (!decodedToken) {
        throw new ApiError(401, "Invalid Access Token");
      }
  
      socket.user = decodedToken;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return next(new ApiError(401, "Invalid token"));
      }
      if (error instanceof jwt.TokenExpiredError) {
        return next(new ApiError(401, "Token expired"));
      }
      return next(new ApiError(401, "Unauthorized request"));
    }
  };