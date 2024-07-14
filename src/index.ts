import { NextFunction, Request, Response, urlencoded } from "express";
import userRoute from "./components/user";
import chatRoute from "./components/chat";
import { Socket } from "socket.io";
import { connectionHandler } from "./components/chat/controller/socket.controller";
import commonController from "./components/common/common.controller";
import path from "path";

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const config = require("config");
const cors = require("cors");
const userMap: any = {};

process.on("uncaughtException", (error, origin) => {
  console.log("----- Uncaught exception -----");
  console.log(error);
  console.log("----- Exception origin -----");
  console.log(origin);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("----- Unhandled Rejection at -----");
  console.log(promise);
  console.log("----- Reason -----");
  console.log(reason);
});

express.application.prefix = express.Router.prefix = function (
  path: any,
  configer: any
) {
  const router = express.Router();
  this.use(path, router);
  configer(router);
  return router;
};

const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(cors());
app.use(urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
// app.use(express.static("./uploads"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads/")));
app.use(cookieParser());

app.prefix("/api/v1/users", (route: any) => {
  userRoute(route);
});
app.prefix("/api/v1/chat", (route: any) => {
  chatRoute(route);
});

app.post(
  "/api/v1/uploadImage/:type",
  async (req: Request, res: Response, next: NextFunction) => {
    await commonController.uploadImage(req, res, next);
  }
);

app.get("/", (req: Request, res: Response) => {
  res.send("server running");
});

server.listen(config.get("PORT"), () => {
  console.log(`server started at http://localhost:${config.get("PORT")}`);

  mongoose
    .connect(config.get("DB_CONN_STRING"))
    .then(() => console.log("🐱 connected to mongodb."))
    .catch((err: any) => console.log("🛑 mongodb not connected"));

  io.on("connection", (args: Socket) => connectionHandler(io, args));
});

export { io, userMap };
