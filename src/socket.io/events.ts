import { Server, Socket } from "socket.io";
import { v4 as uuid } from "uuid";
import { Message } from "../models/message.model";
import { userSocketMap } from "./socket.io";

interface NewMessagePayload {
  chatId: string;
  members: string[];
  message: string;
}

export const getSockets = (users: string[] = []) => {
  const sockets = users.map((user) => userSocketMap.get(user));
  return sockets.filter((socket): socket is string => socket !== undefined);
};

export const handleNewMessage = async (
  socket: Socket,
  payload: NewMessagePayload,
  io: Server
) => {
  const { chatId, message, members } = payload;
  const forEmit = {
    _id: uuid(),
    sender: {
      _id: socket.user?._id.toString() || "",
      fullName: socket.user?.fullName || "",
    },
    chatId,
    media: [
    ],
    content: message,
    createdAt: new Date().toISOString(),
  };

  const sockets = getSockets(members);

  io.to(sockets).emit("NEW_MESSAGE", {
    chatId: chatId,
    message: forEmit,
  });

  // io.to(sockets).emit("NEW_MESSAGE_ALERT", { chatId });

  await Message.create({
    sender: socket.user?._id,
    chatId,
    content: message,
    media: [
    ],
  });

  // console.log("NEW_MESSAGE", forEmit);
};

export const handleDisconnect = (socket: Socket) => {
  userSocketMap.delete(socket.user?._id.toString() || "")
  console.log("handleDisconnect:", userSocketMap,);;
};
