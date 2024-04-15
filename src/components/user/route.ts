import validate from "../../middleware/validate";
import AuthController from "./controller/auth.controller";
import { loginSchema } from "./schema";

export default [
  {
    path: "/login",
    method: "post",
    controller: AuthController.login,
    validation: validate(loginSchema),
    isPublic: true,
  },
];
