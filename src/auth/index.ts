import * as jwt from "jsonwebtoken";
import { UserTokenPayload, UserTokenRole } from "./models";
const config = require("config");

const _generateAccessToken = async (
  payload: any,
  role: UserTokenRole | UserTokenRole[]
) => {
  return jwt.sign(
    { sub: payload, aud: role },
    config.get("JWT_ACCESS_SECRET"),
    { expiresIn: config.get("JWT_ACCESS_TIME") }
  );
};

const _generateRefreshToken = async (payload: any) => {
  return jwt.sign(
    { sub: payload, aud: UserTokenRole.refreshToken },
    config.get("JWT_REFRESH_SECRET"),
    { expiresIn: config.get("JWT_REFRESH_TIME") }
  );
};

const generateUserAccessToken = async (payload: UserTokenPayload) => {
  const accessToken = await _generateAccessToken(
    payload,
    UserTokenRole.accessToken
  );
  const refreshToken = await _generateRefreshToken(payload);
  return { accessToken, refreshToken };
};

const register = async (email: any, otp: any) => {
  const accessToken = await _generateAccessToken(
    email,
    UserTokenRole.registerToken
  );

  return { accessToken };
};

export default {
  generateUserAccessToken,
};
