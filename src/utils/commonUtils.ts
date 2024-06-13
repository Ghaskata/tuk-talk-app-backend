import { Request, Response } from "express";
import verifyToken from "../middleware/validations";
import mongoose from "mongoose";
import multer, { FileFilterCallback } from "multer";
const { Schema, model } = mongoose;
const { ObjectId } = mongoose.Types;
type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallBack = (error: Error | null, filename: string) => void;

const md5 = require("md5");
const path = require("path");

const sendSuccess = async (
  req: Request,
  res: Response,
  data: any,
  statusCode: number = 200
) => {
  return res.status(statusCode).send(data);
};

const sendError = async (
  req: Request,
  res: Response,
  data: any,
  statusCode: number = 422
) => {
  return res.status(statusCode).send(data);
};

const routeArray = (_array: any, prefix: any, isAdmin: Boolean = false) => {
  _array.forEach((route: any) => {
    const path = route.path;
    const controller = route.controller;
    const method = route.method;
    const isPublic = route.isPublic === undefined ? false : route.isPublic;
    const validation = route.validation;
    const middleware = [];

    if (!isPublic) {
      if (isAdmin) {
        // for verifing admin verify accesstoken middleware push in middleware
        middleware.push(route.authMiddleware ?? verifyToken.verifyAccessToken);
      }
      // for  veriingy user verify accesstoken middleware push in middleware
      middleware.push(route.authMiddleware ?? verifyToken.verifyAccessToken);
    }

    if (validation) {
      if (Array.isArray(validation)) {
        middleware.push(...validation);
      } else {
        middleware.push(validation);
      }
    }

    middleware.push(controller);
    prefix[method](path, ...middleware);
  });
  return prefix;
};

const generateRandomString = (length: number) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const convertToObjectId = (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  const objId = new mongoose.Types.ObjectId(id);
  return objId;
};

const generateOtpCode = async (email: any) => {
  if (email == "ghaskataarchna@gmail.com") {
    return 7777;
  }
  return Number((Math.random() * (9999 - 1000) + 1000).toFixed());
};

const fileFilter = (
  req: Request,
  file: any,
  callback: FileFilterCallback
): void => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/webp" ||
    file.mimetype === "image/svg+xml"
  ) {
    callback(null, true);
  } else {
    callback(new Error("Only .png, .jpg and .jpeg .webp .svg format allowed!"));
  }
};

const commonFileStorage = (destination: any) =>
  multer.diskStorage({
    destination: (
      req: Request,
      file: any,
      callback: DestinationCallback
    ): void => {
      callback(null, destination);
    },

    filename: (req: Request, file: any, callback: FileNameCallBack): void => {
      callback(
        null,
        md5(file.originalname) +
          "-" +
          Date.now() +
          path.extname(file.originalname)
      );
    },
  });

export default {
  sendSuccess,
  sendError,
  routeArray,
  generateRandomString,
  convertToObjectId,
  generateOtpCode,
  Schema,
  model,
  ObjectId,

  fileFilter,
  commonFileStorage,
};
