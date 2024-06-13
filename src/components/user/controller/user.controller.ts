import { Request, Response } from "express";
import commonUtils from "../../../utils/commonUtils";
import { AppStrings } from "../../../utils/appStrings";
import { UserTokenPayload } from "../../../auth/models";
import { User } from "../models/user.model";
import { createdirectoryIfNotExist } from "../../../utils/helper";
import multer from "multer";
import path from "path";
import fs from "fs";

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

    const { userName, about ,image} = req.body;

    const user = await User.findByIdAndUpdate(
      payload.userId,
      {
        $set: {
          userName: userName,
          about: about,
          image:image
        },
      },
      {
        new: true,
      }
    ).select("-password -createdAt -blockType");

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

    return commonUtils.sendSuccess(req, res, {
      message: "Profile updated succesfully",
      user,
    });
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

//UPLOAD USER PROFILE IMAGE
// const uploadProfileImage = async (req: Request, res: Response) => {
//   try {
//     const userId: UserTokenPayload = res.locals.payload.userId;
//     const user: any = await User.findById(userId);
//     if (!user) {
//       return commonUtils.sendError(req, res, {
//         message: AppStrings.USER_NOT_FOUND,
//       });
//     }    
//     let destination = "./uploads/profileImage";
//     createdirectoryIfNotExist(destination);
    
//     const image_ = multer({
//       storage: commonUtils.commonFileStorage(destination),
//       fileFilter: commonUtils.fileFilter,
//     }).single("image");
    
//     image_(req, res, async (err: any) => {
//       console.log("image>>>>>", req?.file);

//       if (err) {
//         return commonUtils.sendError(req, res, {
//           message: AppStrings.IMAGE_NOT_UPLOADED,
//           err,
//         });
//       }

//       if (!req.file) {
//         return commonUtils.sendError(req, res, {
//           message: AppStrings.IMAGE_NOT_FOUND,
//         });
//       }

//       const image_name = req.file.filename;

//       if (user?.image) {
//         fs.unlinkSync(path.join(destination) + path.basename(user.image));
//       }

//       await user.updateOne({ image_url: image_name }).exec();
//     });
//   } catch (error) {
//     return commonUtils.sendError(
//       req,
//       res,
//       {
//         message: AppStrings.SOMETHING_WENT_WRONG,
//       },
//       200
//     );
//   }
// };

export default {
  getProfile,
  updateProfile,
};
