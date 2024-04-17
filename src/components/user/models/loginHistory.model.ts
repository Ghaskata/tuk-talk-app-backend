import mongoose from "mongoose";
import { AppConstants } from "../../../utils/appConstants";

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "users",
      default: null,
    },
    deviceName: {
      type: String,
      default: null,
    },
    IPAddress: {
      type: String,
      default: null,
    },
    loginTime: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const loginHistory = mongoose.model(
  AppConstants.MODEL_LOGIN_HISTORY,
  loginHistorySchema
);
