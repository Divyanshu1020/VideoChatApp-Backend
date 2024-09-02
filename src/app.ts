import cors from "cors";
import "dotenv/config";
import express, { urlencoded } from "express";
import { connectDB } from "./db/config";
import { errorHandler } from "./middlewares/error.middleware";
import userRouter from "./routes/user.routes";
import cookieParser from "cookie-parser";

export const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser())

app.use("/api/v1/user", userRouter);


app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
