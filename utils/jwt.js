import jwt from "jsonwebtoken";

const jwtHandler = {
  createJWT({ payload }) {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_LIFETIME,
    });
    return token;
  },
  isTokenValid({ token }) {
    jwt.verify(token, process.env.JWT_SECRET);
  },
};

export default jwtHandler;
