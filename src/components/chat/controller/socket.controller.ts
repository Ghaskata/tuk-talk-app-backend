import { Server, Socket } from "socket.io";
import { SocketAppConstants } from "../../../utils/appConstants";
import { ConnectedUser } from "../connectedUser";
import { userMap } from "../../..";
import { User } from "../../user/models/user.model";
import commonUtils from "../../../utils/commonUtils";
import { Chat } from "../models/chat.model";
import mongoose, { deleteModel } from "mongoose";
import moment from "moment";
import { Conversation } from "../models/conversation.model";
import chatController from "./chat.controller";
import user from "../../user";
import { PipelineStage } from "mongoose";

export const connectionHandler = async (io: Server, client: Socket) => {
  let usersCount = 0;
  let userId = client.handshake.query["userId"]?.toString() ?? "0";

  let clientId = client.id;
  console.log("clientId >>> ", clientId);
  // console.log("client >>> ", client);

  if (userId && userId != "0") {
    if (userMap[userId] === undefined) userMap[userId] = [];
    if (!userMap[userId].includes(clientId)) {
      userMap[userId].push(clientId);
    }

    SocketAppConstants.connectedUsers[clientId] = userId;
    SocketAppConstants.userMap[userId] = new ConnectedUser(userId, clientId);
    console.log(
      `User ${userId} connected successfully. Socket ID: ${clientId}`
    );
  } else {
    console.log(`User connection failed. Socket ID: ${clientId}`);
    return false;
  }

  console.log("usermap >>>> ", userMap);
  console.log("connectedUsers >>>> ", SocketAppConstants.connectedUsers);

  // ************************** HELPER FUNCTIONS *************************** //
  const createOrFindConversation = async (to: any, from: any) => {
    const pipline = [
      {
        $match: {
          senderId: new mongoose.Types.ObjectId(from),
          receiverId: new mongoose.Types.ObjectId(to),
        },
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
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    let conversation = await Conversation.aggregate(pipline);
    let conv: any;
    if (conversation.length === 0) {
      //first time conversation
      let convChatId = new mongoose.Types.ObjectId();

      //create
      //end-user
      const convoDataOther=await Conversation.create({chatId:convChatId,senderId:,reciverId:})
      //self-user
    } else {
      //conversation alredy exist
    }
  };

  // --------------------------------disconnect-------------------------------
  client.on("disconnect", async function () {
    console.log("-----------DISCONNECT-----------");
    let userId = SocketAppConstants.connectedUsers[client.id];

    delete SocketAppConstants.connectedUsers[client.id];

    let soketIndex = userMap[userId]?.findIndex(
      (value: any) => value === client.id
    );
    if (soketIndex !== -1) {
      userMap[userId].splice(soketIndex);
    }

    if (userId) {
      let conversations = await Conversation.find({ senderId: userId });

      conversations.map((conversation: any) =>
        client.leave(conversation?.chatId?.toString())
      );

      if (userMap[userId].length === 0) {
        io.to(
          conversations.map((value: any) =>
            value?.chatId.toString().emit("offline", { user_id: userId })
          )
        );
      }
    }

    client.disconnect(true);
  });

  // ---------------------------------------online--------------------------------------
  client.on("online", async (data, ack) => {
    if (typeof data === "string") {
      data = JSON.parse(data);
    }
    console.log("-----------ONLINE----------", data);
    let userId = SocketAppConstants.connectedUsers[client.id];

    let soketIndex = userMap[userId]?.findIndex(
      (value: any) => value === client.id
    );
    if (soketIndex !== -1) {
      userMap[userId].splice(soketIndex);
    }

    let conversations = await Conversation.find({ senderId: userId });

    conversations.map((conversation: any) =>
      client.join(conversation?.chatId?.toString())
    );

    client.join(userId.toString());
  });

  // ---------------------------------------offline--------------------------------------
  client.on("offline", async (data, ack) => {
    if (typeof data === "string") data = JSON.parse(data);
    console.log("-----------OFFLINE----------", data);
    let userId = SocketAppConstants.connectedUsers[client.id];

    delete SocketAppConstants.connectedUsers[client.id];

    let conversations = await Conversation.find({ senderId: userId });

    conversations.map((conversation: any) =>
      client.leave(conversation?.chatId?.toString())
    );

    if (userMap[userId].length === 0) {
      io.to(
        conversations.map((value: any) =>
          value?.chatId?.toString().emit("offline", data)
        )
      );
    }

    client.disconnect(true);
  });

  // ---------------------------------------chatMessage (send message)--------------------------------------
  client.on("chatMessage", async function (data: any, ack: any) {
    if (typeof data == "string") data = JSON.parse(data);
    console.log("---------------chatMessage----------", data);

    let userId = SocketAppConstants.connectedUsers[client.id];
    console.log({ userId });

    try {
      const user = await User.findById(userId).select(
        "_id image userName about"
      );

      let chatMessage: any = {
        senderId: data.userId,
        reciverId: data.to,
        message: data.message,
        msgType: data.type ? data.type : 1,
        chatId: data.chatId,
      };
      console.log({ chatMessage });

      let messageCreated: any = await Chat.create(chatMessage);

      let message: any = await chatController.formatChatMessage(messageCreated);

      message.senderDetail = user;

      let reciverIsOnline =
        SocketAppConstants.userMap[data.to.toString()] !== null ||
        SocketAppConstants.userMap[data.to.toString()] !== undefined;

      if (reciverIsOnline) {
        let reciver_client_id = userMap[data.to.toString()][0]?.client_id;

        let reciver: any = await User.findById(data.to).select(
          "_id image userName about"
        );

        message.reciverDetail = reciver;

        if (reciver_client_id) {
          io.to(reciver_client_id).emit("chatMessage", message);
        } else {
          //notification of message
        }
      } else {
        //notification of message
      }

      console.log({ message });
      ack(message);
    } catch (error) {
      console.log("chatMessage event Error >>>>> ", error);
    }
  });

  // ---------------------------------------listChats ( List of conversations) --------------------------------------//
  client.on("listChats", async function (data: any, ack: any) {
    if (typeof data == "string") data = JSON.parse(data);
    const userId = SocketAppConstants.connectedUsers[client.id];
    console.log({ userId });
    console.log("-------------listChats----------", data);
    const { limit, offset } = data;

    try {
      let chatIds = await Chat.find({
        $or: [{ senderId: userId }, { reciverId: userId }],
      })
        .sort("updatedAt")
        .limit(limit)
        .skip(offset)
        .distinct("chatId");

      console.log({ chatIds });

      let pipline: PipelineStage[] = [
        {
          $match: {
            senderId: new mongoose.Types.ObjectId(userId),
            chatId: { $in: chatIds },
          },
        },
        { $skip: offset },
        { $limit: limit },
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
              recId: "$receiverId",
              user_id: new mongoose.Types.ObjectId(userId),
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
              recId: "$receiverId",
              user_id: new mongoose.Types.ObjectId(userId),
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

      ack(conversation);
    } catch (e: any) {
      console.log(e);
      ack(e.message);
    }
  });

  // ---------------------------------------createChat (if get then return | create and return) --------------------------------------//
  client.on("createChat", async function (data: any, ack: any) {
    if (typeof data == "string") data = JSON.parse(data);
    let userId = SocketAppConstants.connectedUsers[client.id];
    console.log({ userId });

    console.log("-------------createChat----------", data);

    try {
      let { from, to } = data;

      from = commonUtils.convertToObjectId(from);
      to = commonUtils.convertToObjectId(to);

      if (!from || !to) return false;
      if (from === to) return false;

      let user = await User.findById(userId);

      if (!user) return false;

      let conv: any = await createOrFindConversation(to, from);

      ack();
    } catch (e: any) {
      console.log(e);
      ack(e.message);
    }
  });

  // -----------------------------------deleteMessage----------------------------------
  client.on("deleteMessage", async function (data: any, ack: any) {
    if (typeof data === "string") data = JSON.parse(data);

    const userId = SocketAppConstants.connectedUsers[client.id];

    const { chat_id } = data;
    try {
      let chat: any = await Chat.findOne({
        _id: new mongoose.Types.ObjectId(chat_id),
      });

      if (chat && chat.senderId == userId) {
        const deletedChat = await Chat.findByIdAndUpdate(
          chat._id,
          {
            $set: {
              deletedAt: moment(),
            },
          },
          {
            new: true,
          }
        );

        client.to(chat.senderId).emit("deleteMessage", chat);
        ack(chat);
      } else {
        ack("");
      }
    } catch (error) {
      console.log("delete Message event Error >>>>> ", error);
    }
  });
};
