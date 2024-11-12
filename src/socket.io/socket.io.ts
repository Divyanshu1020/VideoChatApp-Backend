import cookieParser from "cookie-parser";
import { NextFunction } from "express";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import { socketAuth } from "../middlewares/socketAuth.middleware";
import { AccessToken } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { getSockets, handleDisconnect, handleNewMessage } from "./events";
import { avatar } from "../middlewares/multer.middleware";

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
    console.log(userSocketMap);

    socket.on("NEW_MESSAGE", (payload) =>
      handleNewMessage(socket, payload, io)
    );

    socket.on("CALL", ({ to, offer, from }) => {
      console.log("CALL", { to, offer,  });
      const userToCall =getSockets(to)
      io.to(userToCall).emit("INCOMING", {
        offer,
        from
      })
    })

    socket.on("ACCEPT", ({ to, ans }) => {
      console.log("ACCEPT", { to, ans });
      const userToAnswer = getSockets([to])
      io.to(userToAnswer).emit("ACCEPT", {
        ans
      })
    })

    socket.on("DECLINE", ( to ) => {
      console.log("DECLINE", to);
      const userToDecline = getSockets([to])
      console.log("userToDecline", userToDecline);
      io.to(userToDecline).emit("DECLINE", {
        name: socket.user?.userName,
      })
    })

    socket.on("NEGO_NEEDED", ({ to, offer }) => {
      console.log("NEGO_NEEDED", { to, offer });
      const userToAnswer = getSockets([to])
      io.to(userToAnswer).emit("NEGO_NEEDED", {
        from : socket.user?._id,
        offer
      })
    })

    socket.on("NEGO_DONE", ({ to, ans }) => {
      console.log("NEGO_DONE", { to, ans });
      const userToAnswer = getSockets([to])
      io.to(userToAnswer).emit("NEGO_FINAL", {
        to: socket.user?._id,
        ans
      })
    })

    socket.on("disconnect", () => handleDisconnect(socket));
  });

  return io;
};
