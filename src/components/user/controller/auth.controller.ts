import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { User } from "../models/user.model";
import commonUtils from "../../../utils/commonUtils";
import { AppStrings } from "../../../utils/appStrings";
import { loginHistory } from "../models/loginHistory.model";
import Auth from "../../../auth";
import { UserTokenPayload } from "../../../auth/models";
const DeviceDetector = require("node-device-detector");
const moment = require("moment");

const detector = new DeviceDetector({
  clientIndexes: true,
  deviceIndexes: true,
  deviceAliasCode: false,
});

// REGISTER USER TOKEN API
const register = async (req: Request, res: Response) => {
  try {
    const { userName, about, email, mobile, password } = req.body;

    const UserExist = await User.findOne({ email: email });
    if (UserExist) {
      return commonUtils.sendError(req, res, {
        message: "email is already exist",
      });
    }
    const createdUser = await User.create({
      userName,
      about,
      email,
      mobile,
      password,
    });

    return commonUtils.sendSuccess(req, res, createdUser, 201);
  } catch (error) {
    return commonUtils.sendError(req, res, {
      error: AppStrings.SOMETHING_WENT_WRONG,
    });
  }
};

// LOGIN USER API
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
    return commonUtils.sendError(req, res, {
      error: AppStrings.SOMETHING_WENT_WRONG,
    });
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

// FORGET USER PASSWORD API
const forgetPassword = async (req: Request, res: Response) => {
  // try {
  //   const user: any = await User.findOne({ email: req.body.email });
  //   if (!user) {
  //     return commonUtils.sendError(
  //       req,
  //       res,
  //       { message: AppStrings.EMAIL_NOT_EXISTS },
  //       409
  //     );
  //   }
  //   let otp = commonUtils.generateOtpCode(user.email);
  //   return commonUtils.sendSuccess(req, res, otp);
  // } catch (error) {
  //   return commonUtils.sendError(req, res, {
  //     error: AppStrings.SOMETHING_WENT_WRONG,
  //   });
  // }
};

// RESET PASSWORD USER PASSWORD API
const resetPassword = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const payloadData: UserTokenPayload = res.locals.payload.sub;
    console.log("payloadData : ", payloadData);

    const UserExist: any = await User.findById(payloadData.userId);
    if (!UserExist) {
      return commonUtils.sendError(
        req,
        res,
        { message: AppStrings.USER_NOT_FOUND },
        409
      );
    }

    const valid_password = await UserExist.isPasswordCorrect(password);

    if (valid_password) {
      return commonUtils.sendError(
        req,
        res,
        { message: AppStrings.NEW_PASSWORD_DIFFERENT },
        409
      );
    }
    // const updatedPassword = await User.findByIdAndUpdate(
    //   UserExist._id,
    //   {
    //     $set: {
    //       password: password,
    //     },
    //   },
    //   { new: true }
    // );

    UserExist.password = password;

    await UserExist.save();

    return commonUtils.sendSuccess(req, res, {
      message: AppStrings.PASSWORD_CHANGE_SUUCESSFULL,
    });
  } catch (error) {
    return commonUtils.sendError(req, res, {
      error: AppStrings.SOMETHING_WENT_WRONG,
    });
  }
};

// REFRESH USER TOKEN API
const refreshToken = async (req: Request, res: Response) => {
  try {
    const payload: UserTokenPayload = res.locals.payload;
    console.log("--------------------------");
    console.log("payload in refreshtoken >>>>> ", payload);
    const tokenData = await Auth.generateUserAccessToken(payload);
    res.cookie("accessToken", tokenData.accessToken, {
      maxAge: 900000,
      httpOnly: true,
      secure: true,
    });
    res.cookie("refreshToken", tokenData.refreshToken, {
      maxAge: 900000,
      httpOnly: true,
      secure: true,
    });
    return commonUtils.sendSuccess(req, res, { tokenData });
  } catch (error) {
    return commonUtils.sendError(req, res, {
      error: AppStrings.SOMETHING_WENT_WRONG,
    });
  }
};

// SOCIAL LOGIN API
const socialLogin = async (req: Request, res: Response) => {
  try {
    const ipAdd = req.ip?.split(":").pop();
    const currentdate = moment();
    const sessionId = randomUUID();
    const userAgent = req.get("User-Agent");
    const result = detector.detect(userAgent);
    const browserName = `${result.os.name} ${result.client.type} ${result.client.name}`;

    const { email, userName, mobile, image, googleId } = req.body;

    let userExist: any = await User.findOne({ email: email });
    let tokenData;
    if (userExist) {
      if (userExist.userStatus === 1) {
        return commonUtils.sendError(
          req,
          res,
          { message: AppStrings.USER_DEACTIVE_ACCOUNT },
          409
        );
      }
      tokenData = await Auth.generateUserAccessToken({
        userId: userExist._id,
        createdAt: userExist.createdAt,
      });
    } else {
      userExist = await User.create({
        email,
        userName,
        sessionId,
        mobile,
        image,
        socialId: googleId,
      });
      tokenData = await Auth.generateUserAccessToken({
        userId: userExist._id,
        createdAt: userExist.createdAt,
      });
    }

    const data = await userLoginHistory(
      userExist._id,
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

    const updatedUser = await User.findByIdAndUpdate(
      userExist._id,
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
        email: email,
        _id: updatedUser?._id,
      },
    };
    return commonUtils.sendSuccess(req, res, responseData);
  } catch (error: any) {
    console.log("error >> ", error);
    return commonUtils.sendError(req, res, {
      error: AppStrings.SOMETHING_WENT_WRONG,
    });
  }
};

export default {
  login,
  forgetPassword,
  resetPassword,
  refreshToken,
  register,
  socialLogin,
};
