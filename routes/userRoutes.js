import userControllers from "../controllers/userController.js";
import express from "express";
import {
  authenticateUser,
  authorizePermissions,
} from "../middleware/authentication-middleware.js";

const userRouter = express.Router();

userRouter.route("/").get(authenticateUser, userControllers.getAllUsers);

userRouter
  .route("/showMe")
  .get(authenticateUser, userControllers.showCurrentUser);

userRouter
  .route("/updateUser")
  .patch(authenticateUser, userControllers.updateUser);

userRouter
  .route("/updateUserPassword")
  .patch(authenticateUser, userControllers.updateUserPassword);

// dynamic route, keep on bottom
userRouter
  .route("/:id")
  .get(authenticateUser, userControllers.getSingleUser)
  .delete(authenticateUser, userControllers.deleteUser);

userRouter
  .route("/:id/follow")
  .post(authenticateUser, userControllers.followUser);

userRouter
  .route("/:id/unfollow")
  .post(authenticateUser, userControllers.unfollowUser);

export default userRouter;
