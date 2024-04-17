import { urlencoded } from "express";
import userRoute from "./components/user"

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const config = require("config");
const cors = require("cors");

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

app.use(cors());
app.use(urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.static("./uploads"));
app.use(cookieParser());


app.prefix("/api/v1/users",(route:any)=>{
  userRoute(route)
})



app.listen(config.get("PORT"), () => {
  console.log(`server started at http://localhost:${config.get("PORT")}`);

  mongoose
    .connect(config.get("DB_CONN_STRING"))
    .then(() => console.log("🐱 connected to mongodb."))
    .catch((err: any) => console.log("🛑 mongodb not connected"));
});
