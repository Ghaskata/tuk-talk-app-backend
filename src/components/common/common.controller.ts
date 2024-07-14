import { NextFunction, Request, Response, request } from "express";
import { createdirectoryIfNotExist } from "../../utils/helper";
import multer from "multer";
import commonUtils from "../../utils/commonUtils";
import path from "path";
import { AppStrings } from "../../utils/appStrings";
import { UserTokenPayload } from "../../auth/models";
import admin from "../../firebaseConfig";
const fs = require("fs");

// UPLOAD IMAGE API
const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  const { type } = req.params;

  let destination = "./uploads/images";
  if (type === "userProfile") {
    destination = "./uploads/userProfiles";
  }
  createdirectoryIfNotExist(destination);

  const image_ = multer({
    storage: commonUtils.commonFileStorage(destination),
    fileFilter: commonUtils.fileFilter,
  }).array("image", 4);

  image_(req, res, async (err: any) => {
    const { oldImage } = req.body;

    if (oldImage) {
      fs.unlink(
        path.join(__dirname, `../../../${destination}/${oldImage}`),
        (e: any) => {
          if (e) {
            console.log("error imge delete ", e);
          } else {
            console.log("Image deleted succesfully ...");
          }
        }
      );
    }
    if (err) {
      return commonUtils.sendError(req, res, { message: err.message }, 409);
    }

    if (!req.files) {
      return commonUtils.sendError(
        req,
        res,
        { message: AppStrings.IMAGE_NOT_FOUND },
        409
      );
    }

    const images: any = req.files;
    const imagesNames = images.map((file: any) => file.filename);

    return commonUtils.sendSuccess(
      req,
      res,
      {
        file_name: imagesNames,
      },
      200
    );
  });
};

const sendNotification = async (senderId: any, user: any, message: any) => {
  if (user.token != null) {
    await admin
      .messaging()
      .sendToDevice(user.token, message)
      .then((response: any) => {
        console.log("send notification success", response.results);
      })
      .catch((err: any) => {
        console.log("send notification errro", err);
      });
  }
};

export default { uploadImage, sendNotification };
