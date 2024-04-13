import { Request, Response } from "express";

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

const routeArray = (_array: any, prefix: any, isAdmin: false) => {
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
      }
      // for  veriingy user verify accesstoken middleware push in middleware
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


export default {
  sendSuccess,
  sendError,
  routeArray,
  generateRandomString
};
