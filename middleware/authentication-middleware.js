import CustomErrors from "../errors/error-index.js";
import { StatusCodes } from "http-status-codes";
import jwtHandler from "../utils/jwt.js";
import asyncWrapper from "./asyncWrapper.js";

export const authenticateUser = asyncWrapper(async (req, res, next) => {
  const token = req.signedCookies.token;

  if (!token) {
    throw new CustomErrors.UnauthorizedError("Authentication invalid");
  }
  try {
    const payload = jwtHandler.isTokenValid({ token });
    req.user = {
      userId: payload.userId,
      name: payload.name,
      role: payload.role,
      expiration: new Date(payload.exp * 1000).toLocaleString(),
    };
    next();
  } catch (error) {
    throw new CustomErrors.UnauthorizedError("Authentication invalid");
  }
});

export const authorizePermissions = asyncWrapper(async (req, res, next) => {
  console.log("Authorize admin route");
  if (req.user.role === "user") {
    throw new CustomErrors.AccessForbiddenError(
      "Only admin can access this route"
    );
  }
  next();
});
