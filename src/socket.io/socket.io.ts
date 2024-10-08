import cookieParser from "cookie-parser";
import { NextFunction } from "express";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import { socketAuth } from "../middlewares/socketAuth.middleware";
import { AccessToken } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { handleDisconnect, handleNewMessage } from "./events";

declare module "socket.io" {
  interface Socket {
    user?: AccessToken;
  }
}
export const userSocketMap: Map<string, string> = new Map();

export const initSocket = (server: HttpServer): Server => {
  const allowedOrigins = (process.env.CORS_ORIGIN as string).split(',').map(origin => origin.trim());
  const io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          callback(null, origin);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    socketAuth(socket, next);
  });

  io.on("connection", (socket: Socket) => {
    userSocketMap.set(socket.user?._id.toString() || "", socket.id);
    // console.log(userSocketMap);

    socket.on("NEW_MESSAGE", (payload) =>
      handleNewMessage(socket, payload, io)
    );

    socket.on("disconnect", () => handleDisconnect(socket));
  });

  return io;
};
