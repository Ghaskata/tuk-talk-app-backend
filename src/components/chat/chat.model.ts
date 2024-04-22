import { AppConstants } from "../../utils/appConstants";
import commonUtils from "../../utils/commonUtils";

const reactionSchema = new commonUtils.Schema({
  reactionEmoji: String,
  reactionerId: {
    type: commonUtils.ObjectId,
    ref: "users",
  },
});

const chatSchema = new commonUtils.Schema(
  {
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
    reaction: [reactionSchema],
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
