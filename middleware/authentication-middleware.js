import CustomErrors from "../errors/error-index.js";
import Token from "../models/Token.js";
import jwtHandler from "../utils/jwt.js";
import asyncWrapper from "./asyncWrapper.js";
import crypto from "crypto";

export const authenticateUser = asyncWrapper(async (req, res, next) => {
  const { accessToken, refreshToken } = req.signedCookies;

  if (!accessToken && !refreshToken) {
    throw new CustomErrors.UnauthorizedError("Authentication invalid");
  }

  if (accessToken) {
    const payload = jwtHandler.isTokenValid(accessToken);
    req.user = payload.user;
    return next();
  }

  const payload = jwtHandler.isTokenValid(refreshToken);
  const existingToken = await Token.findOne({
    user: payload.user.userId,
    refreshToken: payload.refreshToken,
  });

  if (!existingToken || !existingToken?.isValid) {
    throw new CustomErrors.UnauthorizedError("Authentication Invalid");
  }

  const newRefreshToken = crypto.randomBytes(40).toString("hex");
  existingToken.refreshToken = newRefreshToken;
  await existingToken.save();

  jwtHandler.attachCookiesToResponse({
    res,
    user: payload.user,
    refreshToken: existingToken.refreshToken,
  });

  req.user = payload.user;
  next();
});

export const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new CustomErrors.AccessForbiddenError("Access forbidden");
    }
    next();
  };
};
