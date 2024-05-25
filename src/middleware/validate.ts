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
        let validationErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          validationErrors[err.path.join(".")] = err.message;
        });
        console.log(validationErrors);
        return commonUtils.sendError(req, res, { errors: validationErrors });
      }
      return commonUtils.sendError(req, res, {
        message: AppStrings.SOMETHING_WENT_WRONG,
        error: error?.message,
      });
    }
  };

export default validate;

// method 1
// const validationErrors = error.errors.map((err) => ({
//   message: err.message,
//   path: err.path.join("."),
// }));

//method 2
// const validationErrors = error.errors.map((err) => ({
//   [err.path.toString()]: err.message,    //////////////also valid
// }));
