import mongoose from "mongoose";
import { AppConstants } from "../../../utils/appConstants";

const deviceTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },
    token: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const deviceToken = mongoose.model(
  AppConstants.MODEL_DEVICE_TOKEN,
  deviceTokenSchema
);
