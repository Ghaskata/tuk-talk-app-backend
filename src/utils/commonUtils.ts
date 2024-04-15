import { Request, Response } from "express";
import verifyToken from "../middleware/validations";
import mongoose from "mongoose";
const { Schema, model } = mongoose;
const { ObjectId } = mongoose.Types;

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

    if (Array.isArray(validation)) {
      middleware.push(...validation);
    } else {
      middleware.push(validation);
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

export default {
  sendSuccess,
  sendError,
  routeArray,
  generateRandomString,
  convertToObjectId,
  Schema,
  model,
  ObjectId,
};
