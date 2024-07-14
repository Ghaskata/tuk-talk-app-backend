import { Server, Socket } from "socket.io";
import { SocketAppConstants } from "../../../utils/appConstants";
import { ConnectedUser } from "../connectedUser";
import { User } from "../../user/models/user.model";
import commonUtils from "../../../utils/commonUtils";
import { Chat } from "../models/chat.model";
import mongoose, { deleteModel } from "mongoose";
import moment from "moment";
import { Conversation } from "../models/conversation.model";
import chatController from "./chat.controller";
import user from "../../user";
import { PipelineStage } from "mongoose";
import { deviceToken } from "../../user/models/deviceToken";
import commonController from "../../common/common.controller";

export const connectionHandler = async (io: Server, client: Socket) => {
  let usersCount = 0;
  let userId = client.handshake.query["userId"]?.toString() ?? "0";

  let clientId = client.id;
  console.log("clientId >>> ", clientId);

  if (!userId || userId === "0") {
    console.log(
      `User connection failed. Invalid userId: ${userId}, Socket ID: ${clientId}`
    );
    return false;
  }

  // console.log(
  //   `Before connection: usermap >>>> ${JSON.stringify(
  //     SocketAppConstants.userMap,
  //     null,
  //     2
  //   )}`
  // );

  if (!SocketAppConstants.userMap[userId]) {
    SocketAppConstants.userMap[userId] = [];
  }
  if (!SocketAppConstants.userMap[userId].includes(clientId)) {
    SocketAppConstants.userMap[userId].push(clientId);
  }

  SocketAppConstants.connectedUsers[clientId] = userId;

  console.log(`User ${userId} connected successfully. Socket ID: ${clientId}`);

  console.log(
    "After connection: userMap >>>> ",
    JSON.stringify(SocketAppConstants.userMap, null, 2)
  );
  console.log(
    "connectedUsers >>>> ",
    JSON.stringify(SocketAppConstants.connectedUsers, null, 2)
  );

  // ************************** HELPER FUNCTIONS *************************** //
  const createOrFindConversation = async (to: any, from: any) => {
    const pipline = [
      {
        $match: {
          senderId: new mongoose.Types.ObjectId(from),
          reciverId: new mongoose.Types.ObjectId(to),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reciverId",
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
      const convoDataOther = await Conversation.create({
        chatId: convChatId,
        senderId: to,
        reciverId: from,
      });

      //self-user
      const convMe = await Conversation.create({
        chatId: convChatId,
        senderId: from,
        reciverId: to,
      });

      const user = await User.findById(to)
        .select("_id userName about image mobile email")
        .lean();

      if (!user) {
        throw new Error("user not found");
      }
      conv = {
        ...convMe.toObject(),
        user: {
          reciverId: user._id,
          userName: user.userName,
          about: user.about,
          image: user.image,
          mobile: user.mobile,
          email: user.email,
        },
      };
      conv.exist_conversation = 0;
    } else {
      //conversation alredy exist
      // const readAllChat = await Chat.updateMany(
      //   {
      //     chatId: conversation[0].chatId,
      //     senderId: new mongoose.Types.ObjectId(to),
      //     reciverId: new mongoose.Types.ObjectId(from),
      //     readStatus: 0,
      //   },
      //   {
      //     $set: {
      //       readStatus: 1,
      //     },
      //   },
      //   { new: true }
      // );
      conv = conversation[0];
      conv.exist_conversation = 1;
    }

    conv.id = conv._id;
    conv.isOnline = !!SocketAppConstants.userMap[conv.reciverId];
    conv.createdDate = moment(conv.createdAt).format("YYYY-MM-DD HH:mm:ss");
    conv.updatedDate = moment(conv.updatedAt).format("YYYY-MM-DD HH:mm:ss");
    conv.success = true;

    SocketAppConstants.userMap[conv.reciverId.toString()]?.map((v: any) => {
      // io.sockets.sockets.get(v.client_id)?.join(conv.chatId.toString());
      io.sockets.sockets.get(v)?.join(conv.chatId.toString());
    });
    SocketAppConstants.userMap[conv.senderId.toString()]?.map((v: any) => {
      // io.sockets.sockets.get(v.client_id)?.join(conv.chatId.toString());
      io.sockets.sockets.get(v)?.join(conv.chatId.toString());
    });

    return conv;
  };

  // --------------------------------disconnect-------------------------------
  client.on("disconnect", async function () {
    // console.log("-----------DISCONNECT-----------");
    let userId = SocketAppConstants.connectedUsers[client.id];

    if (!userId) {
      console.log(`User ID not found for client ID: ${client.id}`);
      return;
    }
    console.log(`Disconnecting client ID: ${client.id} for user ID: ${userId}`);

    delete SocketAppConstants.connectedUsers[client.id];

    let soketIndex = SocketAppConstants.userMap[userId]?.indexOf(client.id);

    if (soketIndex !== -1 && soketIndex !== undefined) {
      SocketAppConstants.userMap[userId].splice(soketIndex, 1);
      console.log(`Removed client ID: ${client.id} from userMap[${userId}]`);
    } else {
      console.log(`Client ID: ${client.id} not found in userMap[${userId}]`);
    }

    if (
      SocketAppConstants.userMap[userId] &&
      SocketAppConstants.userMap[userId]?.length === 0
    ) {
      delete SocketAppConstants.userMap[userId];
      console.log(`User ID: ${userId} completely removed from userMap`);
    }

    if (userId) {
      let conversations = await Conversation.find({ senderId: userId });

      conversations.map((conversation: any) =>
        client.leave(conversation?.chatId?.toString())
      );

      if (conversations.length > 0) {
        // io.to(
        //   conversations.map((value: any) =>
        //     value?.chatId.toString().emit("offline", { user_id: userId })
        //   )
        // );
        conversations.forEach((conversation: any) => {
          const chatIdString = conversation?.chatId.toString();
          if (chatIdString) {
            io.to(chatIdString).emit("offline", { user_id: userId });
          }
        });
      }
    }

    client.disconnect(true);
  });

  // ---------------------------------------online--------------------------------------
  client.on("online", async (data, ack) => {
    if (typeof data === "string") {
      data = JSON.parse(data);
    }
    // console.log("-----------ONLINE----------", data);
    let userId = SocketAppConstants.connectedUsers[client.id];

    let conversations = await Conversation.find({ senderId: userId });

    conversations.map((conversation: any) =>
      client.join(conversation?.chatId?.toString())
    );

    client.join(userId.toString());
    conversations.forEach((conversation: any) => {
      io.to(conversation?.chatId.toString()).emit("online", {
        userId,
        ...data,
      });
    });
  });

  // ---------------------------------------offline--------------------------------------
  client.on("offline", async (data, ack) => {
    if (typeof data === "string") data = JSON.parse(data);
    // console.log("-----------OFFLINE----------", data);
    let userId = SocketAppConstants.connectedUsers[client.id];

    delete SocketAppConstants.connectedUsers[client.id];

    let socketIndex = SocketAppConstants.userMap[userId]?.indexOf(client.id);

    console.log("REMOVED_INDEX ", socketIndex);

    if (socketIndex !== -1) {
      SocketAppConstants.userMap[userId].splice(socketIndex, 1);
    }
    console.log("AFTER_REMOVED ", SocketAppConstants.userMap[userId]);

    let conversations = await Conversation.find({ senderId: userId });

    conversations.map((conversation: any) =>
      client.leave(conversation?.chatId?.toString())
    );

    if (SocketAppConstants.userMap[userId].length === 0) {
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
    // console.log("---------------chatMessage----------", data);

    let userId = SocketAppConstants.connectedUsers[client.id];
    // console.log({ userId });

    try {
      const user = await User.findById(userId).select(
        "_id image userName about"
      );
      let reciver: any = await User.findById(data.to).select(
        "_id image userName about"
      );

      let chatMessage: any = {
        senderId: userId,
        reciverId: data.to,
        message: data.message,
        msgType: data.type ? data.type : 1,
        chatId: data.chatId,
      };
      // console.log({ chatMessage });

      let messageCreated: any = await Chat.create(chatMessage);

      let message: any = await chatController.formatChatMessage(messageCreated);

      message.senderDetail = user;

      const handleNotification = async () => {
        const tokenRecord = await deviceToken.findOne({ userId: data.to });

        if (!tokenRecord || !tokenRecord.token) {
          throw new Error("Token not found or invalid");
        }

        const token = tokenRecord.token;
        let user_ = {
          _id: data.to,
          token: token,
          message: message,
        };

        const msg = {
          notification: {
            title: "Tuk Tuk",
            body: data.message.toString(),
          },
          data: {
            message: JSON.stringify(message),
            id: String(message?.id),
            chat_id: String(data.chatId),
            sender: JSON.stringify(user),
          },
        };

        console.log({ msg });
        await commonController.sendNotification(userId, user_, msg);
      };

      let reciverIsOnline = !!SocketAppConstants.userMap[data.to.toString()];

      if (reciverIsOnline) {
        let reciver_client_ids = SocketAppConstants.userMap[data.to.toString()];

        message.reciverDetail = reciver;

        if (reciver_client_ids && reciver_client_ids.length > 0) {
          reciver_client_ids.forEach((client_id) => {
            io.to(client_id).emit("chatMessage", message);
          });
        } else {
          //notification
          await handleNotification();
        }
      } else {
        //notification of message
        await handleNotification();
      }

      // console.log({ message });
      ack(message);
    } catch (e: any) {
      console.log("chatMessage event Error >>>>> ", e);
      ack(new Error(e.message));
    }
  });

  // ---------------------------------------listChats ( List of conversations) --------------------------------------//
  client.on("listChats", async function (data: any, ack: any) {
    if (typeof data == "string") data = JSON.parse(data);
    const userId = SocketAppConstants.connectedUsers[client.id];
    // console.log({ userId });
    // console.log("-------------listChats----------", data);
    // const { limit, offset } = data;

    try {
      let chatIds = await Conversation.find({
        $or: [{ senderId: userId }, { reciverId: userId }],
      }).distinct("chatId");

      // console.log({ userId, chatIds });

      let pipline: PipelineStage[] = [
        {
          $match: {
            senderId: new mongoose.Types.ObjectId(userId),
            chatId: { $in: chatIds },
          },
        },
        // { $skip: offset },
        // { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "reciverId",
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
              recId: "$reciverId",
              user_id: new mongoose.Types.ObjectId(userId),
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $and: [
                          { $eq: ["$reciverId", "$$recId"] },
                          { $eq: ["$senderId", "$$user_id"] },
                        ],
                      },
                      {
                        $and: [
                          { $eq: ["$reciverId", "$$user_id"] },
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
              recId: "$reciverId",
              user_id: new mongoose.Types.ObjectId(userId),
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$reciverId", "$$user_id"] },
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
      // console.log({ userId, conversation });

      conversation = conversation.map((value: any) => {
        return {
          ...{
            id: value._id,
            userId: value.reciverId,
            userName: value?.user?.userName,
            isOnline: !!SocketAppConstants.userMap[value.reciverId],
            chatId: value.chatId,
            profilePic: value.user?.image ?? "",
            msgType: value?.message?.msgType ?? 0,
            email: value.user?.email ?? "",
            mobile: value?.user?.mobile ?? null,
            message: value?.message?.message?.toString() ?? "",
            time:
              chatController.formatMessageTime(value?.message?.createdAt) ?? "",
            unreadCount: value?.unreadCount?.unreadCount,
          },
        };
      });

      // console.log({ userId, conversation });

      ack(conversation);
    } catch (e: any) {
      console.log(e);
      ack(new Error(e.message));
    }
  });

  // ---------------------------------------listChats option that people suggestions means that peopele to whome never conversation start  --------------------------------------//
  client.on("listSuggestionChats", async function (data: any, ack: any) {
    if (typeof data == "string") data = JSON.parse(data);
    const userId = SocketAppConstants.connectedUsers[client.id];
    // console.log({ userId });
    // console.log("-------------listSuggestionChats----------", data);
    // const { limit, offset } = data;

    try {
      const usersInConversations = await Conversation.find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      }).select("senderId reciverId");

      const usersInConversationsIds: string[] = usersInConversations
        .map((conv: any) => {
          if (conv.senderId && conv.senderId.toString() !== userId) {
            return conv.senderId.toString();
          }
          if (conv.reciverId && conv.reciverId.toString() !== userId) {
            return conv.reciverId.toString();
          }
          return null;
        })
        .filter((id) => id !== null) as string[];

      // console.log({ userId });
      // console.log({ usersInConversations });
      // console.log({ usersInConversationsIds });
      usersInConversationsIds.push(userId.toString());

      const userSuggestions = await User.find({
        _id: { $nin: usersInConversationsIds },
      });
      // .skip(offset)
      // .limit(limit);

      // console.log({ userSuggestions });

      ack(userSuggestions);
    } catch (e: any) {
      console.log(e);
      ack(new Error(e.message));
    }
  });

  // ---------------------------------------createChat (if get then return | create and return) --------------------------------------//
  client.on("createChat", async function (data: any, ack: any) {
    if (typeof data == "string") data = JSON.parse(data);
    let userId = SocketAppConstants.connectedUsers[client.id];
    // console.log({ userId });

    // console.log("-------------createChat----------", data);

    try {
      let { from, to } = data;

      from = commonUtils.convertToObjectId(from);
      to = commonUtils.convertToObjectId(to);

      if (!from || !to || from === to) {
        throw new Error("Invalid from or to ObjectId");
      }

      let user = await User.findById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      // if (!from || !to) return false;
      // if (from === to) return false;

      // let user = await User.findById(userId);

      // if (!user) return false;
      let conv: any = await createOrFindConversation(to, from);

      let convObject = {
        id: conv.id,
        userId: conv.reciverId,
        chatId: conv.chatId,
        isOnline: conv.isOnline,
        profilePic: conv.user?.image ?? "",
        username: conv.user?.userName,
        createdDate: conv.createdDate,
        updatedDate: conv.updatedDate,
        email: conv?.user?.email ?? "",
        mobile: conv?.user?.mobile ?? 0,
        exist_conversation: conv.exist_conversation,
      };

      ack(convObject);
    } catch (e: any) {
      console.log(e);
      ack(new Error(e.message));
    }
  });

  // -----------------------------------readAllMessages----------------------------------
  client.on("readAllMessages", async function (data: any, ack: any) {
    if (typeof data === "string") data = JSON.parse(data);

    const userId = SocketAppConstants.connectedUsers[client.id];

    const { chat_id, user_id } = data;

    try {
      const chat = await Chat.updateMany(
        {
          chatId: chat_id,
          reciverId: userId,
          senderId: user_id,
          readStatus: 0,
        },
        {
          $set: { readStatus: 1 },
        },
        { new: true }
      );
      ack(true);
    } catch (error) {
      console.log("readAllMessages event Error >>>>> ", error);
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
