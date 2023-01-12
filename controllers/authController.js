import asyncWrapper from "../middleware/asyncWrapper.js";
import User from "../models/User.js";
import customErrors from "../errors/error-index.js";
import { StatusCodes } from "http-status-codes";

const authControllers = {
  register: asyncWrapper(async (req, res, next) => {
    const { name, email, password } = req.body;

    //the first created account will be an admin
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const role = isFirstAccount ? "admin" : "user";

    const user = await User.create({ name, email, password, role });
    res.status(StatusCodes.CREATED).json({ user });
  }),

  login: asyncWrapper(async (req, res, next) => {
    res.send("Login user controller");
  }),

  logout: asyncWrapper(async (req, res, next) => {
    res.send("Logout controller");
  }),
};

export default authControllers;
