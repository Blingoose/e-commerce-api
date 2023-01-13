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

    jwtHandler.attachCookiesToResponse({ res, user: tokenUser });

    res.status(StatusCodes.CREATED).json({ user: tokenUser });
  }),

  login: asyncWrapper(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new customErrors.BadRequestError("Password and email are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new customErrors.UnauthorizedError(`User ${email} doesn't exist`);
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new customErrors.UnauthorizedError("Invalid password");
    }

    const tokenUser = { name: user.name, userId: user._id, role: user.role };
    jwtHandler.attachCookiesToResponse({ res, user: tokenUser });
    res.status(StatusCodes.OK).json({ user });
  }),

  logout: asyncWrapper(async (req, res, next) => {
    res.send("Logout controller");
  }),
};

export default authControllers;
