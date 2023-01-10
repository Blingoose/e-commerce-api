import asyncWrapper from "../middleware/asyncWrapper.js";

const authControllers = {
  register: asyncWrapper(async (req, res, next) => {
    res.send("Register user controller");
  }),

  login: asyncWrapper(async (req, res, next) => {
    res.send("Login user controller");
  }),

  logout: asyncWrapper(async (req, res, next) => {
    res.send("Logout controller");
  }),
};

export default authControllers;
