import validate from "../../middleware/validate";
import AuthController from "./controller/auth.controller";
import {
  loginSchema,
  registerSchema,
  resetPassSchema,
  updateProfileSchema,
} from "./schema";
import Middlewares from "../../middleware/validations";
import userController from "./controller/user.controller";

export default [
  {
    path: "/login",
    method: "post",
    controller: AuthController.login,
    validation: validate(loginSchema),
    isPublic: true,
  },
  {
    path: "/resetPassword",
    method: "post",
    controller: AuthController.resetPassword,
    validation: validate(resetPassSchema),
  },
  {
    path: "/refreshToken",
    method: "post",
    controller: AuthController.refreshToken,
    authMiddleware: Middlewares.verifyRefreshToken,
  },
  {
    path: "/register",
    method: "post",
    validation: validate(registerSchema),
    controller: AuthController.register,
    isPublic: true,
  },
  {
    path: "/socialLogin",
    method: "post",
    controller: AuthController.socialLogin,
    isPublic: true,
  },
  {
    path: "/profile",
    method: "get",
    controller: userController.getProfile,
  },
  {
    path: "/updateProfile",
    method: "post",
    validation: validate(updateProfileSchema),
    controller: userController.updateProfile,
  },
];
