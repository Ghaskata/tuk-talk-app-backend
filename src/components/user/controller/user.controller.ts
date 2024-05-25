import { Request, Response } from "express";
import commonUtils from "../../../utils/commonUtils";
import { AppStrings } from "../../../utils/appStrings";
import { UserTokenPayload } from "../../../auth/models";
import { User } from "../models/user.model";

// USER PROFILE API
const getProfile = async (req: Request, res: Response) => {
  try {
    const payload: UserTokenPayload = res.locals.payload;

    const user = await User.findById(payload.userId).select(
      "-password -createdAt -blockType"
    );

    if (!user) {
      return commonUtils.sendError(
        req,
        res,
        {
          message: AppStrings.USER_NOT_FOUND,
        },
        409
      );
    }

    return commonUtils.sendSuccess(req, res, { user });
  } catch (error) {
    return commonUtils.sendError(
      req,
      res,
      {
        message: AppStrings.SOMETHING_WENT_WRONG,
      },
      200
    );
  }
};

//UPDATE USER PROFILE API
const updateProfile = async (req: Request, res: Response) => {
  try {
    const payload: UserTokenPayload = res.locals.payload;

    const { userName, about } = req.body;
    
    const user = await User.findById(payload.userId).select(
      "-password -createdAt -blockType"
    );

    if (!user) {
      return commonUtils.sendError(
        req,
        res,
        {
          message: AppStrings.USER_NOT_FOUND,
        },
        409
      );
    }

    return commonUtils.sendSuccess(req, res, { user });
  } catch (error) {
    return commonUtils.sendError(
      req,
      res,
      {
        message: AppStrings.SOMETHING_WENT_WRONG,
      },
      200
    );
  }
};

export default {
  getProfile,
  updateProfile,
};
