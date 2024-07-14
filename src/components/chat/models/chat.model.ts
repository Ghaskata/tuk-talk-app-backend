import mongoose from "mongoose";
import { AppConstants } from "../../../utils/appConstants";
import commonUtils from "../../../utils/commonUtils";

const chatSchema = new commonUtils.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "conversations",
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
    parentChatId: {
      type: commonUtils.ObjectId,
      ref: "chats",
      default: null,
    },
    message: {
      type: String,
      required: true,
    },
    msgType: {
      type: Number,
      enum: [1, 2],
      require: true,
      comment: "1=text 2=image",
    },
    reactions: [
      {
        type: String,
      },
    ],
    readStatus: {
      type: Number,
      default: 0,
      comment: "0=unread, 1=read",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Chat = commonUtils.model(AppConstants.MODEL_CHAT, chatSchema);
