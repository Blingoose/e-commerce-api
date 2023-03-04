import CustomErrors from "../errors/error-index.js";
import jwtHandler from "../utils/jwt.js";

export const authenticateUser = (req, res, next) => {
  const token = req.signedCookies.accessToken || req.signedCookies.refreshToken;
  console.log(req.signedCookies);

  if (!token) {
    throw new CustomErrors.UnauthorizedError("Authentication invalid");
  }

  try {
    const payload = jwtHandler.isTokenValid({ token });
    console.log(payload);

    req.user = {
      userId: payload.user.userId,
      name: payload.user.name,
      role: payload.user.role,
      username: payload.user.username,
    };
    next();
  } catch (error) {
    throw new CustomErrors.UnauthorizedError("Authentication invalid");
  }
};

export const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new CustomErrors.AccessForbiddenError("Access forbidden");
    }
    next();
  };
};
