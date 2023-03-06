import User from "../models/User.js";
import Token from "../models/Token.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import CustomErrors from "../errors/error-index.js";
import { StatusCodes } from "http-status-codes";
import jwtHandler from "../utils/jwt.js";
import { excludeFields, logoutUser } from "../utils/utils.js";
import checkPermission from "../utils/checkPermissions.js";
import authControllers from "./authController.js";

const userControllers = {
  getAllUsers: asyncWrapper(async (req, res, next) => {
    const { role } = req.user;
    const exclude = excludeFields(role);

    //find all users who has role of "user", except for the current user.
    const users = await User.find({
      role: "user",
      username: { $nin: req.user.username },
    }).select(exclude);

    if (users.length === 0) {
      throw new CustomErrors.NotFoundError("No users in database");
    }
    res.status(StatusCodes.OK).json({ users });
  }),

  getSingleUser: asyncWrapper(async (req, res, next) => {
    const { id: username } = req.params;
    const { role, currentUsername } = req.user;
    const exclude = excludeFields(role, currentUsername, username);
    const user = await User.findOne({ username: username }).select(exclude);

    if (!user) {
      throw new CustomErrors.NotFoundError(
        `No user found with username: ${username}`
      );
    }
    res.status(StatusCodes.OK).json({ user });
  }),

  showCurrentUser: asyncWrapper(async (req, res, next) => {
    const exclude = excludeFields("admin");
    const currentUser = await User.findOne({
      username: req.user.username,
    }).select(exclude);

    res.status(StatusCodes.OK).json({ user: currentUser });
  }),

  updateUser: asyncWrapper(async (req, res, next) => {
    const { name, email, username } = req.body;

    if (Object.keys(req.body).length < 1) {
      throw new CustomErrors.BadRequestError(
        "Must provide at least one field [name, username, email] to update"
      );
    }
    const user = await User.findOne({ username: req.user.username });

    user.email = email || user.email;
    user.name = name || user.name;
    user.username = username || user.username;

    await user.save();

    const tokenUser = jwtHandler.createTokenUser(user);
    jwtHandler.attachCookiesToResponse({ res, user: tokenUser });

    res.status(StatusCodes.OK).json({ user: tokenUser });
  }),

  updateUserPassword: asyncWrapper(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new CustomErrors.BadRequestError(
        `You must provide both old password and new password. Example: "oldPassword":"123456", "newPassword":"0123456789"`
      );
    }

    const user = await User.findOne({ username: req.user.username });
    const isOldPasswordMatch = await user.comparePassword(oldPassword);

    if (isOldPasswordMatch === false) {
      throw new CustomErrors.UnauthorizedError("old password is invalid");
    }

    user.password = newPassword;
    await user.save();

    res.status(StatusCodes.OK).json({ msg: "Success! password updated" });
  }),

  deleteUser: asyncWrapper(async (req, res, next) => {
    const { id: username } = req.params;
    const user = await User.findOne({ username: username });
    if (!user) {
      throw new CustomErrors.NotFoundError(
        `No user found with username: ${username}`
      );
    }

    checkPermission(req.user, user._id.toString(), username);
    // logout before deletion
    await Token.findOneAndDelete({ user: req.user.userId });

    logoutUser(res);
    await user.remove();

    res
      .status(StatusCodes.OK)
      .json(`User ${username} had been successfully removed`);
  }),

  followUser: asyncWrapper(async (req, res, next) => {
    const { id: usernameToFollow } = req.params;

    const userToFollow = await User.findOne({ username: usernameToFollow });
    if (!userToFollow) {
      throw new CustomErrors.NotFoundError(
        `No user found with username: ${usernameToFollow}`
      );
    }

    const existingFollow = await User.findOne({
      username: req.user.username,
      following: { $in: [usernameToFollow] },
    });

    if (existingFollow) {
      throw new CustomErrors.BadRequestError("You already following this user");
    }

    if (req.user.username === usernameToFollow) {
      throw new CustomErrors.BadRequestError("You cannot follow yourself");
    }

    const bulkWrite = [
      {
        updateOne: {
          filter: { username: usernameToFollow },
          update: {
            $addToSet: { followers: req.user.username },
            $inc: { countFollowers: 1 },
          },
        },
      },
      {
        updateOne: {
          filter: { username: req.user.username },
          update: {
            $addToSet: { following: usernameToFollow },
            $inc: { countFollowing: 1 },
          },
        },
      },
    ];

    await User.bulkWrite(bulkWrite);

    res
      .status(StatusCodes.OK)
      .json({ msg: `Started following ${userToFollow.username}` });
  }),

  unfollowUser: asyncWrapper(async (req, res, next) => {
    const { id: usernameToUnfollow } = req.params;

    const userToUnfollow = await User.findOne({ username: usernameToUnfollow });
    if (!userToUnfollow) {
      throw new CustomErrors.NotFoundError(
        `No user found with username: ${usernameToUnfollow}`
      );
    }

    const existingFollow = await User.findOne({
      username: req.user.username,
      following: { $in: [usernameToUnfollow] },
    });

    if (!existingFollow) {
      throw new CustomErrors.BadRequestError("You are not following this user");
    }

    const bulkWrite = [
      {
        updateOne: {
          filter: { username: usernameToUnfollow },
          update: {
            $pull: { followers: req.user.username },
            $inc: { countFollowers: -1 },
          },
        },
      },

      {
        updateOne: {
          filter: { username: req.user.username },
          update: {
            $pull: { following: usernameToUnfollow },
            $inc: { countFollowing: -1 },
          },
        },
      },
    ];

    await User.bulkWrite(bulkWrite);

    res
      .status(StatusCodes.OK)
      .json({ msg: `You unfollowed ${userToUnfollow.username}` });
  }),
};

export default userControllers;
