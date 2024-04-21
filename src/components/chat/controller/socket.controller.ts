import { Server, Socket } from "socket.io";

export const connectionHandler = async (io: Server, client: Socket) => {
  const clientId = client.id;
  console.log("clientId >>> ",clientId)
  console.log("client >>> ",client)
};
