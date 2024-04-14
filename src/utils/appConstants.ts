const config = require("config");

export const AppConstants = {
  USER_IMAGE_PATH: config.get("ROUTE_URL") + "/uploads/userImage/",

  MODEL_USER: "User",
  MODEL_ADMIN: "Admin",
  MODEL_LOGIN_HISTORY: "LoginHistory",

  MODEL_CHAT: "Chat",
};
