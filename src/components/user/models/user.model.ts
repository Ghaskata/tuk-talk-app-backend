import mongoose, { Document } from "mongoose";
import { AppConstants } from "../../../utils/appConstants";
const bcrypt = require("bcrypt");

export interface UserDocument extends Document {
  userName?: string | null;
  about?: string | null;
  sessionId?: string | null;
  email: string;
  mobile: string;
  password: string;
  image?: string | null;
  userStatus: number;
  blockType: number;
  socialId?: string;
  refreshToken: string;

  createdAt: string;
  updatedAt: string;

  isPasswordCorrect(password: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    userName: {
      type: String,
      require: false,
      default: null,
    },
    about: {
      type: String,
      require: false,
      default: null,
    },
    sessionId: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      require: false,
      lowercase: true,
      trim: true,
      default: null,
    },
    mobile: {
      type: String,
      require: true,
      default: null,
    },
    password: {
      type: String,
      require: false,
      default: null,
    },
    image: {
      type: String,
      require: false,
      default: null,
    },
    userStatus: {
      type: Number,
      require: false,
      default: 0, // 0 unblock 1 block
    },
    blockType: {
      type: Number,
      require: false,
      default: 0, // 1 violat entry, 2 admin block, 3 chat block
    },
    socialId: {
      type: String,
      require: false,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model<UserDocument>(
  AppConstants.MODEL_USER,
  userSchema
);
