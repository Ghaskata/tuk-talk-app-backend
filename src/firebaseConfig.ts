var notification = require("firebase-admin");

var serviceAccount = require("./firebaseTokens.json");

notification.initializeApp({
  credential: notification.credential.cert(serviceAccount),
});

export default notification;
