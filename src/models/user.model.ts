import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Document, model, Schema } from "mongoose";
export interface UserSchema extends Document {
  fullName: string;
  userName: string;
  email: string;
  password: string;
  avatar: {
    publicId: string;
    url: string;
  };
  refreshToken: string;
  generateAccessToken: () => string;
  generateRefreshToken: () => string;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}
export interface AccessToken {
  _id: string;
  email: string;
  fullName: string;
  userName: string;
}

const userSchema = new Schema<UserSchema>(
  {
    fullName: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
      lowecase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowecase: true,
      trim: true,
    },
    avatar: {
      publicId: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    refreshToken: {
      type: String,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre<UserSchema>("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    String(process.env.ACCESS_TOKEN_SECRET),
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    String(process.env.REFRESH_TOKEN_SECRET),
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = model<UserSchema>("User", userSchema);
