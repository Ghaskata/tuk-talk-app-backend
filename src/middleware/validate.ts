import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import commonUtils from "../utils/commonUtils";
import { AppStrings } from "../utils/appStrings";

const validate =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          message: err.message,
          path: err.path.join("."),
        }));
        return commonUtils.sendError(req, res, validationErrors);
      }
      return commonUtils.sendError(req, res, {
        message: AppStrings.SOMETHING_WENT_WRONG,
        error: error?.message,
      });
    }
  };

export default validate;
