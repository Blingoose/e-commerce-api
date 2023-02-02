import CustomErrors from "../errors/error-index.js";
import jwtHandler from "../utils/jwt.js";

export const authenticateUser = (req, res, next) => {
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
      username: payload.username,
      expiration: new Date(payload.exp * 1000).toLocaleString(),
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
