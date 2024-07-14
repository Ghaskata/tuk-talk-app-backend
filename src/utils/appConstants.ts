import { ConnectedUser } from "../components/chat/connectedUser";

const config = require("config");

export const AppConstants = {
  USER_IMAGE_PATH: config.get("ROUTE_URL") + "/uploads/userImage/",

  MODEL_USER: "User",
  MODEL_ADMIN: "Admin",
  MODEL_LOGIN_HISTORY: "LoginHistory",
  MODEL_DEVICE_TOKEN: "DeviceToken",

  MODEL_CHAT: "Chat",
  MODEL_CONVERSATION: "Conversation",
};

export class SocketAppConstants {
  public static connectedUsers: { [clientId: string]: string } = {};
  // public static userMap: { [userKey: string]: ConnectedUser } = {};
  public static userMap: { [userId: string]: string[] } = {};
}
