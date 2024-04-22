import { Server, Socket } from "socket.io";
import { SocketAppConstants } from "../../../utils/appConstants";
import { ConnectedUser } from "../connectedUser";
import { userMap } from "../../..";
import { User } from "../../user/models/user.model";
import commonUtils from "../../../utils/commonUtils";
import { Chat } from "../chat.model";
import mongoose, { deleteModel } from "mongoose";
import moment from "moment";

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
    console.log("User connection failed. Socket ID: ${clientId}");
    return false;
  }

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

    client.disconnect(true);
  });

  // ---------------------------------------chatMessage (send message)--------------------------------------
  client.on("chatMessage", async function (data: any, ack: any) {
    if (typeof data == "string") data = JSON.parse(data);

    let userId = SocketAppConstants.connectedUsers[client.id];
    console.log({ userId });

    const { reciverId, parentChatId, message, msgType } = data;

    try {
      if (reciverId && message) {
        const reciverObjId = commonUtils.convertToObjectId(reciverId);
        const reciverExist = await User.findOne({
          _id: reciverObjId,
          userStatus: 0,
        }).select("userName about image");

        const senderObjId = commonUtils.convertToObjectId(userId);
        const sender = await User.findById(senderObjId);

        if (reciverExist) {
          let chat: any = await Chat.create({
            senderId: userId,
            reciverId: reciverId,
            parentChatId: parentChatId,
            message: message,
            msgType: msgType ? msgType : 1,
          });

          chat = JSON.parse(JSON.stringify(chat)); //deep clone it not change original but cretae new one that deeply cloned orignale

          // chat.reciverName = reciverExist.userName;
          // chat.reciverImage = reciverExist.image;
          chat.senderImage = reciverExist.userName;
          chat.senderImage = reciverExist.image;

          if (chat.parentChatId) {
            let oldChat = await Chat.aggregate([
              {
                $match: {
                  _id: new mongoose.Types.ObjectId(parentChatId),
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "parentChatId",
                  foreignField: "_id",
                  as: "users",
                },
              },
              {
                $unwind: {
                  path: "users",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  createdAt: {
                    $dateToString: {
                      format: "%Y-%m-%d %H:%M:%S", // Customize the format here
                      date: "$createdAt",
                    },
                  },
                  message: "$message",
                },
              },
            ]);
            chat.parentChat = oldChat?.[0];
          }

          client.to(reciverId.toString()).emit("chatMessage", chat);
          console.log({ chat });
          ack(chat);
        }
      }
    } catch (error) {
      console.log("chatMessage event Error >>>>> ", error);
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
