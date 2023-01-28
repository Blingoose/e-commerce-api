import asyncWrapper from "../middleware/asyncWrapper.js";
import User from "../models/user.js";
import CustomErrors from "../errors/error-index.js";
import { StatusCodes } from "http-status-codes";
import jwtHandler from "../utils/jwt.js";
import joi from "joi";

const authControllers = {
  register: asyncWrapper(async (req, res, next) => {
    const { name, email, password } = req.body;

    //the first created account will be an admin
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const role = isFirstAccount ? "admin" : "user";

    const user = await User.create({ name, email, password, role });
    const tokenUser = jwtHandler.createTokenUser(user);

    jwtHandler.attachCookiesToResponse({ res, user: tokenUser });

    res.status(StatusCodes.CREATED).json({ user: tokenUser });
  }),

  login: asyncWrapper(async (req, res, next) => {
    const { email, password } = req.body;
    if (!password) {
      throw new CustomErrors.UnauthorizedError("Must provide password");
    }
    const validateFields = new User({ email, password });
    await validateFields.validate({ pathsToSkip: ["name", "password"] });

    const user = await User.findOne({ email });
    console.log(user);

    if (!user) {
      throw new CustomErrors.UnauthorizedError(`User ${email} doesn't exist`);
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new CustomErrors.UnauthorizedError("Invalid password");
    }

    const tokenUser = jwtHandler.createTokenUser(user);
    jwtHandler.attachCookiesToResponse({ res, user: tokenUser });
    res.status(StatusCodes.OK).json({ user: tokenUser });
  }),

  logout: (req, res, next) => {
    res.cookie("token", "logout", {
      httpOnly: true,
      expires: new Date(Date.now()),
    });
    res.status(StatusCodes.OK).send({ msg: "Logged-out" });
  },
};

export default authControllers;
