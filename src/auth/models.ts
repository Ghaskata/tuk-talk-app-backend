export enum UserTokenRole {
  accessToken = "access",
  adminAccessToken = "admin_access",
  refreshToken = "refresh",
  registerToken = "register",
  resetPasswordToken = "reset_password",
  loginToken = "login",
  adminLoginToken = "admin_login",
}


export interface UserTokenPayload {
    userId: string
    createdAt: string
}
