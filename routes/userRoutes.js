import userControllers from "../controllers/userController.js";
import express from "express";
import {
  authenticateUser,
  authorizePermissions,
} from "../middleware/authentication-middleware.js";

const userRouter = express.Router();

userRouter
  .route("/")
  .get(authenticateUser, authorizePermissions, userControllers.getAllUsers);
userRouter.route("/showMe").get(userControllers.showCurrentUser);
userRouter.route("/updateUser").patch(userControllers.updateUser);
userRouter
  .route("/updateUserPassword")
  .patch(userControllers.updateUserPassword);

// dynamic route, keep on bottom
userRouter.route("/:id").get(authenticateUser, userControllers.getSingleUser);

export default userRouter;
