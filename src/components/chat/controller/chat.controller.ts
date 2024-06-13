import { Request, Response } from "express";
import { Chat } from "../models/chat.model";
import moment from "moment";
import mongoose from "mongoose";
import { UserTokenPayload } from "../../../auth/models";
import { Conversation } from "../models/conversation.model";
import commonUtils from "../../../utils/commonUtils";

const listConversation = async (req: Request, res: Response) => {
  let payloadData: UserTokenPayload = res.locals.payload;
  let { userId } = payloadData;

  let { limit, offset, search } = req.query;

  let filter: any = [];

  if (search && search !== "") {
    filter.push({
      $match: {
        "user.userName": { $regex: search, $options: "i" },
      },
    });
  }

  let limitNumber = parseInt(limit as string, 10);
  let offsetNumber = parseInt(offset as string, 10);

  let chatIds = await Chat.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
  })
    .sort({ createdAt: -1 })
    .distinct("chatId");

  console.log("===============");
  console.log({ chatIds });

  const pipline = [
    {
      $match: {
        senderId: userId,
        chatId: { $in: chatIds },
      },
    },
    {
      ...filter,
    },
    {
      $lookup: {
        from: "users",
        localField: "receiverId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "chats",
        let: {
          recId: "receiverId",
          user_id: "userId",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [
                      { $eq: ["$receiverId", "$$recId"] },
                      { $eq: ["$senderId", "$$user_id"] },
                    ],
                  },
                  {
                    $and: [
                      { $eq: ["$receiverId", "$$user_id"] },
                      { $eq: ["$senderId", "$$recId"] },
                    ],
                  },
                ],
              },
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 1,
          },
        ],
        as: "message",
      },
    },
    {
      $unwind: { path: "$message", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "chats",
        let: {
          recId: "receiverId",
          user_id: "userId",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$receiverId", "$$user_id"] },
                  { $eq: ["$senderId", "$$recId"] },
                  { $eq: ["$readStatus", 0] },
                ],
              },
            },
          },
          {
            $count: "unreadCount",
          },
          {
            $project: { unreadCount: 1 },
          },
        ],
        as: "unreadCount",
      },
    },
    { $unwind: { path: "$unreadCount", preserveNullAndEmptyArrays: true } },

    { $sort: { "message.createdAt": -1 } },
    { $skip: offsetNumber },
    { $limit: limitNumber },
  ];

  let conversation = await Conversation.aggregate(pipline);
  console.log({ conversation });

  conversation = conversation.map((value: any) => {
    return {
      ...{
        id: value._id,
        userId: value.receiverId,
        userName: value?.user?.userName,
        chatId: value.chatId,
        profilePic: value.user?.image ?? "",
        msgType: value?.message?.msgType ?? 0,
        email: value.user?.email ?? "",
        mobile: value?.user?.mobile ?? null,
        message: value?.message?.message?.toString() ?? "",
        time: value?.message?.createdAt ?? "",
        unreadCount: value?.unreadCount?.unreadCount,
      },
    };
  });

  return commonUtils.sendSuccess(req, res, { conversation });
};

const formatChatMessage = async (chatMessage: any) => {
  let oldChat;
  if (chatMessage.parentChatId) {
    oldChat = await Chat.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(chatMessage.parentChatId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "senderId",
          foreignField: "_id",
          as: "senderDetail",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reciverId",
          foreignField: "_id",
          as: "reciverDetail",
        },
      },
      {
        $unwind: { path: "$senderDetail", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$reciverDetail", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          message: 1,
          time: {
            $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$createdAt" },
          },
          to: "$receiverId",
          from: "$senderId",
          chatId: 1,
          type: 1,
          reactions: 1,
          parentChatId: 1,
          senderDetail: { $arrayElemAt: ["$senderDetail", 0] },
          receiverDetail: { $arrayElemAt: ["$receiverDetail", 0] },
        },
      },
    ]);
  }

  return {
    id: chatMessage._id,
    message: chatMessage.message,
    time: moment(chatMessage.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    to: chatMessage.receiverId,
    from: chatMessage.senderId,
    chatId: chatMessage.chatId,
    type: chatMessage.type,
    reactions: chatMessage.reactions,
    parentChatId: chatMessage.parentChatId && oldChat?.[0],
  };
};

export default {
  formatChatMessage,
  listConversation,
};
