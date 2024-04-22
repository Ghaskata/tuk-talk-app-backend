import { Server, Socket } from "socket.io";
import { SocketAppConstants } from "../../../utils/appConstants";
import { ConnectedUser } from "../connectedUser";
import { userMap } from "../../..";
import { User } from "../../user/models/user.model";
import commonUtils from "../../../utils/commonUtils";
import { Chat } from "../chat.model";

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

        if (reciverExist) {
          let chat = await Chat.create({
            senderId: userId,
            reciverId: reciverId,
            parentChatId: parentChatId && parentChatId,
            message: message,
            msgType: msgType ? msgType : 1,
          });

          chat = JSON.parse(JSON.stringify(chat));

          // chat.reciverName=reciverExist.userName
          // const chatResponse = {
          //   ...chat.toObject(),
          //   reciverName: reciverExist.userName,
          //   reciverImage: reciverExist.image,
          // };
        }
      }
    } catch (error) {
      console.log("chatMessage event Error >>>>> ", error);
    }
  });
};
