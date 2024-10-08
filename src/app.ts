import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { connectDB } from "./db/config";
import { errorHandler } from "./middlewares/error.middleware";
import chatRouter from "./routes/chat.routes";
import userRouter from "./routes/user.routes";
import { createUser } from "./seeder/user";
import { initSocket } from "./socket.io/socket.io";

export const app = express();
const server = createServer(app);
export const io = initSocket(server);
const allowedOrigins = (process.env.CORS_ORIGIN as string).split(',').map(origin => origin.trim());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/chat", chatRouter);

app.get("/CreateUsers", (req, res) => {
  createUser(10);
  res.send("CreateUsers");
});

app.use(errorHandler);

connectDB()
  .then(() => {
    server.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
