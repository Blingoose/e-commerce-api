import jwt from "jsonwebtoken";

//* functions related to jwt token

const jwtHandler = {
  createJWT({ payload }) {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_LIFETIME,
    });
    return token;
  },

  isTokenValid({ token }) {
    return jwt.verify(token, process.env.JWT_SECRET);
  },

  attachCookiesToResponse({ res, user }) {
    const token = this.createJWT({ payload: user });
    const oneDay = 1000 * 60 * 60 * 24;

    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + oneDay),
      secure: process.env.NODE_ENV === "production",
      signed: true,
    });
  },

  createTokenUser(user) {
    return {
      name: user.name,
      userId: user._id,
      role: user.role,
      email: user.email,
    };
  },
};

export default jwtHandler;
