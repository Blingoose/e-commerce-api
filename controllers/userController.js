import CustomErrors from "../errors/error-index.js";
import asyncWrapper from "../middleware/asyncWrapper.js";

const userControllers = {
  getAllUsers: asyncWrapper(async (req, res, next) => {
    res.send("get all users route");
  }),
  getSingleUser: asyncWrapper(async (req, res, next) => {
    res.send("get single user route");
  }),
  showCurrentUser: asyncWrapper(async (req, res, next) => {
    res.send("show current user route");
  }),
  updateUser: asyncWrapper(async (req, res, next) => {
    res.send("update user route");
  }),
  updateUserPassword: asyncWrapper(async (req, res, next) => {
    res.send("update user password route");
  }),
};

export default userControllers;
