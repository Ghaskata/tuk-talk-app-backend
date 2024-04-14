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
  return new Promise<JwtPayload>((resolve, reject) => {
    jwt.verify(
      jwtToken,
      config.get("JWT_ACCESS_SECRET"),
      { audience: role },
      async (error: VerifyErrors, payload: JwtPayload) => {
        if (error) {
          if (error instanceof TokenExpiredError) {
            return reject(AppStrings.TOKEN_EXPIRED);
          }
        }
        if (payload?.sub) {
          return resolve(payload);
        }
        return reject(AppStrings.INVALID_SESSION);
      }
    );
  });
};

const _verifyUserToken = async (
  authHeader: string,
  role: UserTokenRole | UserTokenRole[]
) => {
  let tokens = authHeader.split(" ") || [];
  if (tokens.length <= 1) {
    throw AppStrings.INVALID_SESSION;
  }
  const token = tokens[1];

  return _verifyJwtToken(token, role).then((payload) => {
    const decodedPayload = payload.sub;
    if (decodedPayload) {
      return decodedPayload;
    }
    throw AppStrings.INVALID_SESSION;
  });
};

const verifyAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token = req.headers?.authorization ?? "";
  return _verifyUserToken(token, UserTokenRole.accessToken)
    .then((decodedPayload) => {
      res.locals.payload = decodedPayload;
      next();
    })
    .catch((err: any) => {
      return commonUtils.sendError(req, res, { message: err }, 401);
    });
};

const verifyRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token = req.headers?.authorization ?? "";
  return _verifyUserToken(token, UserTokenRole.refreshToken)
    .then((decodedPayload) => {
      res.locals.payload = decodedPayload;
      next();
    })
    .catch((err: any) => {
      return commonUtils.sendError(req, res, { message: err }, 401);
    });
};

export default {
  verifyAccessToken,
  verifyRefreshToken,
};
