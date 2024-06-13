import mongoose from "mongoose";
import { AppConstants } from "../../../utils/appConstants";
import commonUtils from "../../../utils/commonUtils";

const conversationSchema = new commonUtils.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    reciverId: {
      type: commonUtils.ObjectId,
      ref: "users",
      required: true,
    },
    senderId: {
      type: commonUtils.ObjectId,
      ref: "users",
      required: true,
    },
    clearedAt: {
      type: mongoose.Schema.Types.Number,
    },
    pin: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    mute: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    deleted: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    active: {
      type: mongoose.Schema.Types.Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Conversation = commonUtils.model(
  AppConstants.MODEL_CONVERSATION,
  conversationSchema
);
