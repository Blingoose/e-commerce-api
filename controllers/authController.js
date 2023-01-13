import asyncWrapper from "../middleware/asyncWrapper.js";
import User from "../models/User.js";
import customErrors from "../errors/error-index.js";
import { StatusCodes } from "http-status-codes";
import jwtHandler from "../utils/jwt.js";

const authControllers = {
  register: asyncWrapper(async (req, res, next) => {
    const { name, email, password } = req.body;

    //the first created account will be an admin
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const role = isFirstAccount ? "admin" : "user";

    const user = await User.create({ name, email, password, role });
    const tokenUser = { name: user.name, userId: user._id, role: user.role };

    const token = jwtHandler.createJWT({ payload: tokenUser });

    const oneDay = 1000 * 60 * 60 * 24;
    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + oneDay),
    });

    res.status(StatusCodes.CREATED).json({ user: tokenUser });
  }),

  login: asyncWrapper(async (req, res, next) => {
    res.send("Login user controller");
  }),

  logout: asyncWrapper(async (req, res, next) => {
    res.send("Logout controller");
  }),
};

export default authControllers;
