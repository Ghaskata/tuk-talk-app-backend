import { NextFunction, Request, Response, request } from "express";
import { createdirectoryIfNotExist } from "../../utils/helper";
import multer from "multer";
import commonUtils from "../../utils/commonUtils";

// UPLOAD IMAGE API
const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  const { type } = req.params;

  let destination = "./uploads/images";
  if (type === "user") {
    destination = "./uploads/user";
  }
  createdirectoryIfNotExist(destination);

  const image_ = multer({
    storage: commonUtils.commonFileStorage(destination),
    fileFilter: commonUtils.fileFilter,
  }).array("image", 4);

  image_(req, res, async (error: any) => {
    const { oldImage } = req.body;

   
  });
};
