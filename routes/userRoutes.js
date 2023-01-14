import userControllers from "../controllers/userController.js";
import express from "express";

const userRouter = express.Router();

userRouter.route("/").get(userControllers.getAllUsers);
userRouter.route("/showMe").get(userControllers.showCurrentUser);
userRouter.route("/updateUser").post(userControllers.updateUser);
userRouter
  .route("/updateUserPassword")
  .post(userControllers.updateUserPassword);

userRouter.route("/:id").get(userControllers.getSingleUser);

export default userRouter;
