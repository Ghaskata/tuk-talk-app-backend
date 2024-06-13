import chatController from "./controller/chat.controller";

export default [
    {
        path: "/list-conversation",
        method: "get",
        controller: chatController.listConversation,
    }
]