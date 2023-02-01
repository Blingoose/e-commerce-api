import User from "../models/user.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import CustomErrors from "../errors/error-index.js";
import { StatusCodes } from "http-status-codes";
import jwtHandler from "../utils/jwt.js";
import { excludeFields } from "../utils/utils.js";

const userControllers = {
  getAllUsers: asyncWrapper(async (req, res, next) => {
    const { role } = req.user;
    const exclude = excludeFields(role);

    //find all users who has role of "user", except for the current user.
    const users = await User.find({
      role: "user",
      _id: { $nin: req.user.userId },
    }).select(exclude);

    if (users.length === 0) {
      throw new CustomErrors.NotFoundError("No users in database");
    }
    res.status(StatusCodes.OK).json({ users });
  }),

  getSingleUser: asyncWrapper(async (req, res, next) => {
    const { id: userId } = req.params;
    const { role, userId: currentUserId } = req.user;
    const exclude = excludeFields(role, currentUserId, userId);
    const user = await User.findById(userId).select(exclude);

    if (!user) {
      throw new CustomErrors.NotFoundError(`No item found with id: ${user}`);
    }
    res.status(StatusCodes.OK).json({ user });
  }),

  showCurrentUser: asyncWrapper(async (req, res, next) => {
    const exclude = excludeFields("admin");
    const currentUser = await User.findById(req.user.userId).select(exclude);

    res.status(StatusCodes.OK).json({ user: currentUser });
  }),

  updateUser: asyncWrapper(async (req, res, next) => {
    const { name, email } = req.body;
    if (!name || !email) {
      throw new CustomErrors.BadRequestError("Must provide name and email");
    }

    const user = await User.findOne({ _id: req.user.userId });

    user.email = email;
    user.name = name;

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

    const user = await User.findById(req.user.userId);
    const isOldPasswordMatch = await user.comparePassword(oldPassword);

    if (isOldPasswordMatch === false) {
      throw new CustomErrors.UnauthorizedError("old password is invalid");
    }

    user.password = newPassword;
    await user.save();

    res.status(StatusCodes.OK).json({ msg: "Success! password updated" });
  }),

  deleteUser: asyncWrapper(async (req, res, next) => {
    const { id: userId } = req.params;
  }),

  followUser: asyncWrapper(async (req, res, next) => {
    const { id: userToFollowId } = req.params;

    const userToFollow = await User.findById(userToFollowId);
    if (!userToFollow) {
      throw new CustomErrors.NotFoundError(
        `No item found with id: ${userToFollowId}`
      );
    }

    const existingFollow = await User.findOne({
      _id: req.user.userId,
      following: { $in: [userToFollowId] },
    });

    if (existingFollow) {
      throw new CustomErrors.BadRequestError("You already following this user");
    }

    if (req.user.userId === userToFollowId) {
      throw new CustomErrors.BadRequestError("You cannot follow yourself");
    }

    const bulkWrite = [
      {
        updateOne: {
          filter: { _id: userToFollowId },
          update: {
            $addToSet: { followers: req.user.userId },
            $inc: { countFollowers: 1 },
          },
        },
      },
      {
        updateOne: {
          filter: { _id: req.user.userId },
          update: {
            $addToSet: { following: userToFollowId },
            $inc: { countFollowing: 1 },
          },
        },
      },
    ];

    await User.bulkWrite(bulkWrite);

    res
      .status(StatusCodes.OK)
      .json({ msg: `Started following ${userToFollow.name}` });
  }),

  unfollowUser: asyncWrapper(async (req, res, next) => {
    const { id: userToUnfollowId } = req.params;

    const userToUnfollow = await User.findById(userToUnfollowId);
    if (!userToUnfollow) {
      throw new CustomErrors.NotFoundError(
        `No item found with id: ${userToUnfollowId}`
      );
    }

    const existingFollow = await User.findOne({
      _id: req.user.userId,
      following: { $in: [userToUnfollowId] },
    });

    if (!existingFollow) {
      throw new CustomErrors.BadRequestError("You are not following this user");
    }

    const bulkWrite = [
      {
        updateOne: {
          filter: { _id: userToUnfollowId },
          update: {
            $pull: { followers: req.user.userId },
            $inc: { countFollowers: -1 },
          },
        },
      },

      {
        updateOne: {
          filter: { _id: req.user.userId },
          update: {
            $pull: { following: userToUnfollowId },
            $inc: { countFollowing: -1 },
          },
        },
      },
    ];

    await User.bulkWrite(bulkWrite);

    res
      .status(StatusCodes.OK)
      .json({ msg: `You unfollowed ${userToUnfollow.name}` });
  }),
};

export default userControllers;

//! Reference for using findOneAndUpdate, which doesn't triggers the pre("save") in the User module.
// updateUser: asyncWrapper(async (req, res, next) => {
//   const { name, email } = req.body;
//   if (!name || !email) {
//     throw new CustomErrors.BadRequestError("Must provide name and email");
//   }

//   const user = await User.findOneAndUpdate(
//     { _id: req.user.userId },
//     { $set: { email, name } },
//     { new: true, runValidators: true }
//   );

//   const tokenUser = jwtHandler.createTokenUser(user);
//   jwtHandler.attachCookiesToResponse({ res, user: tokenUser });

//   res.status(StatusCodes.OK).json({ user: tokenUser });
// })
