import { urlencoded } from "express";

const express = require("express");
const mongoose = require("mongoose");

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

const app = express();

app.use(urlencoded({ limit: "50mb", extended: true }));
app.use(express.static("./uploads"));

console.log("evergreen");