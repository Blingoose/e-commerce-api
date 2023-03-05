import jwt from "jsonwebtoken";

//* functions related to jwt token

const jwtHandler = {
  createJWT({ payload }) {
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    return token;
  },

  isTokenValid(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  },

  attachCookiesToResponse({ res, user, refreshToken }) {
    const accessTokenJWT = this.createJWT({ payload: { user } });
    const refreshTokenJWT = this.createJWT({ payload: { user, refreshToken } });
    const oneHour = 1000 * 60 * 60;
    const thirtyDays = oneHour * 24 * 30;

    res.cookie("accessToken", accessTokenJWT, {
      httpOnly: true,
      expires: new Date(Date.now() + oneHour),
      secure: process.env.NODE_ENV === "production",
      signed: true,
    });

    res.cookie("refreshToken", refreshTokenJWT, {
      httpOnly: true,
      expires: new Date(Date.now() + thirtyDays),
      secure: process.env.NODE_ENV === "production",
      signed: true,
    });
  },

  createTokenUser(user) {
    return {
      name: user.name,
      username: user.username,
      userId: user._id,
      role: user.role,
      email: user.email,
    };
  },
};

export default jwtHandler;
