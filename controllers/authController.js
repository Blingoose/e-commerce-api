import asyncWrapper from "../middleware/asyncWrapper.js";
import User from "../models/User.js";
import customErrors from "../errors/error-index.js";
import { StatusCodes } from "http-status-codes";

const authControllers = {
  register: asyncWrapper(async (req, res, next) => {
    const { name, email, password } = req.body;

    const user = await User.create({ name, email, password });
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
