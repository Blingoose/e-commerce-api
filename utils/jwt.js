import jwt from "jsonwebtoken";

//* functions related to jwt token

const jwtHandler = {
  createJWT({ payload }) {
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    return token;
  },

  isTokenValid({ token }) {
    return jwt.verify(token, process.env.JWT_SECRET);
  },

  attachCookiesToResponse({ res, user, refreshToken }) {
    const accessTokenJWT = this.createJWT({ payload: { user } });
    const refreshTokenJWT = this.createJWT({ payload: { user, refreshToken } });
    const fifteenMinutes = 1000 * 60 * 15;
    const oneMonth = fifteenMinutes * 4 * 24 * 30;

    res.cookie("accessToken", accessTokenJWT, {
      httpOnly: true,
      expires: new Date(Date.now() + fifteenMinutes),
      secure: process.env.NODE_ENV === "production",
      signed: true,
    });

    res.cookie("refreshToken", refreshTokenJWT, {
      httpOnly: true,
      expires: new Date(Date.now() + oneMonth),
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
