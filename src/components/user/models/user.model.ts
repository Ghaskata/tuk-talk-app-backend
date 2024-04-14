import mongoose from "mongoose";
import { AppConstants } from "../../../utils/appConstants";

const userSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

export const User = mongoose.model(AppConstants.MODEL_USER, userSchema);
