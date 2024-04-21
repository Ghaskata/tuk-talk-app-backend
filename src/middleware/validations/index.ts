import { error } from "console";
import { UserTokenPayload, UserTokenRole } from "../../auth/models";
import { JwtPayload, TokenExpiredError, VerifyErrors } from "jsonwebtoken";
import { AppStrings } from "../../utils/appStrings";
import { NextFunction, Request, Response } from "express";
import commonUtils from "../../utils/commonUtils";

const jwt = require("jsonwebtoken");
const config = require("config");

const _verifyJwtToken = async (
  jwtToken: string,
  role: UserTokenRole | UserTokenRole[]
) => {
  try {
    const payload = await jwt.verify(
      jwtToken,
      config.get("JWT_ACCESS_SECRET"),
      { audience: role }
    );
    return payload as JwtPayload;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new Error(AppStrings.TOKEN_EXPIRED);
    }
    throw new Error(AppStrings.INVALID_SESSION);
  }
};

const _verifyUserToken = async (
  token: string,
  role: UserTokenRole | UserTokenRole[]
) => {
  // let tokens = authHeader.split(" ") || [];
  // if (tokens.length <= 1) {
  //   throw AppStrings.INVALID_SESSION;
  // }
  // const token = tokens[1];

  try {
    const decodedPayload = await _verifyJwtToken(token, role);
    return decodedPayload;
  } catch (error) {
    throw new Error(AppStrings.INVALID_SESSION);
  }
};

const verifyAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // let token = req.headers?.authorization ?? "";
  let token = req.header("Authorization")?.replace("Bearer ", "") || "";
  // console.log(
  //   "headers authorization accesstoken in access middleware >>>>> ",
  //   token
  // );
  try {
    const decodedPayload = await _verifyUserToken(
      token,
      UserTokenRole.accessToken
    );
    res.locals.payload = decodedPayload;
    next();
  } catch (error: any) {
    return commonUtils.sendError(req, res, { error: error.message }, 401);
  }
};

const verifyRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // let token = req.headers?.Authorization ?? "";
  let token = req.header("Authorization")?.replace("Bearer ", "") ?? "";
  // console.log(
  //   "headers authorization refresh in refresh middleware >>>>> ",
  //   token
  // );
  try {
    // const decodedPayload = await _verifyUserToken(
    //   token,
    //   UserTokenRole.refreshToken
    // );
    const decodedPayload = await jwt.verify(
      token,
      config.get("JWT_REFRESH_SECRET"),
      { audience: UserTokenRole.refreshToken }
    );
    res.locals.payload = decodedPayload.sub;
    next();
  } catch (error: any) {
    return commonUtils.sendError(req, res, { error: error.message }, 401);
  }
};

export default {
  verifyAccessToken,
  verifyRefreshToken,
};
