import userControllers from "../controllers/userController.js";
import express from "express";

const userRouter = express.Router();

userRouter.route("/").get(userControllers.getAllUsers);
userRouter.route("/showMe").get(userControllers.showCurrentUser);
userRouter.route("/updateUser").patch(userControllers.updateUser);
userRouter
  .route("/updateUserPassword")
  .patch(userControllers.updateUserPassword);

// dynamic route, keep on bottom
userRouter.route("/:id").get(userControllers.getSingleUser);

export default userRouter;
