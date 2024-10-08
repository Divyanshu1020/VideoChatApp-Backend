import { Request } from "express-serve-static-core";
import { io } from "../app";
import { getSockets } from "../socket.io/events";

type EmitEvent =
  | "NEW_MESSAGE"
  | "NEW_MESSAGE_ALERT"
  | "NEW_REQUEST"
  | "WELLCOME"
  | "REFETCH";

export const emitEvent = (
  req: Request,
  eventName: EmitEvent,
  user: unknown[],
  data: object
) => {
  const toSend = getSockets(user as string[]);
  io.to(toSend).emit(eventName, data);
};
