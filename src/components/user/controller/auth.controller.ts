import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { User } from "../models/user.model";
import commonUtils from "../../../utils/commonUtils";
import { AppStrings } from "../../../utils/appStrings";
import { loginHistory } from "../models/loginHistory.model";
import Auth from "../../../auth";
const DeviceDetector = require("node-device-detector");
const moment = require("moment");

const detector = new DeviceDetector({
  clientIndexes: true,
  deviceIndexes: true,
  deviceAliasCode: false,
});

const login = async (req: Request, res: Response) => {
  try {
    const ipAdd = req.ip?.split(":").pop();
    const currentdate = moment();
    const sessionId = randomUUID();
    const userAgent = req.get("User-Agent");
    const result = detector.detect(userAgent);
    const browserName = `${result.os.name} ${result.client.type} ${result.client.name}`;

    const userData = await User.findOne({ email: req.body.email });
    if (!userData) {
      return commonUtils.sendError(
        req,
        res,
        { message: AppStrings.EMAIL_NOT_REG },
        409
      );
    }

    if (userData.userStatus == 1) {
      return commonUtils.sendError(
        req,
        res,
        { message: AppStrings.USER_DEACTIVE_ACCOUNT },
        409
      );
    }

    const valid_password = await userData.isPasswordCorrect(req.body.password);
    if (!valid_password) {
      return commonUtils.sendError(
        req,
        res,
        { message: AppStrings.INVALID_PASSWORD },
        409
      );
    }

    const data = await userLoginHistory(
      userData._id,
      ipAdd,
      currentdate,
      browserName,
      req.headers.host
    );
    if (data === "history not created.") {
      return commonUtils.sendError(req, res, {
        message: AppStrings.SOMETHING_WENT_WRONG,
      });
    }

    const tokenData = await Auth.generateUserAccessToken({
      userId: userData._id,
      createdAt: userData.createdAt,
    });

    const updatedUser = await User.findByIdAndUpdate(
      userData._id,
      {
        $set: { sessionId: sessionId, refreshToken: tokenData.refreshToken },
      },
      { new: true }
    );
    res.cookie("accessToken", tokenData.accessToken, {
      httpOnly: true,
      secure: true,
    });
    res.cookie("refreshToken", tokenData.refreshToken, {
      httpOnly: true,
      secure: true,
    });

    const responseData = {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      userData: {
        email: userData.email,
        _id: userData._id,
      },
      sessionId: sessionId,
    };
    return commonUtils.sendSuccess(req, res, responseData, 200);
  } catch (error: any) {
    return commonUtils.sendError(
      req,
      res,
      { error: AppStrings.SOMETHING_WENT_WRONG },
      200
    );
  }
};

const userLoginHistory = async (
  userId: any,
  IPAddress: any,
  time: any,
  deviceName: any,
  hostIP: any
) => {
  try {
    const data = await loginHistory.create({
      userId: userId,
      deviceName: deviceName,
      IPAddress: IPAddress,
      loginTime: time,
    });
    return data;
  } catch (error) {
    return "history not created.";
  }
};

export default { login };
