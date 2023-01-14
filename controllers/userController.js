import CustomErrors from "../errors/error-index.js";
import asyncWrapper from "../middleware/asyncWrapper.js";

const userControllers = {
  getAllUsers: asyncWrapper(async (req, res, next) => {
    res.send("get all users route");
  }),
  getSingleUser: asyncWrapper(async (req, res, next) => {
    res.send(req.params);
  }),
  showCurrentUser: asyncWrapper(async (req, res, next) => {
    res.send("show current user route");
  }),
  updateUser: asyncWrapper(async (req, res, next) => {
    res.send(req.body);
  }),
  updateUserPassword: asyncWrapper(async (req, res, next) => {
    res.send(req.body);
  }),
};

export default userControllers;
