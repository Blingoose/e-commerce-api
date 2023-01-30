import User from "../models/user.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import CustomErrors from "../errors/error-index.js";
import { StatusCodes } from "http-status-codes";
import jwtHandler from "../utils/jwt.js";
import checkPermission from "../utils/checkPermissions.js";

const userControllers = {
  getAllUsers: asyncWrapper(async (req, res, next) => {
    console.log(req.user);
    // find the user but exclude password from the user data.
    const users = await User.find({ role: "user" }).select("-password");
    if (users.length === 0) {
      throw new CustomErrors.NotFoundError("No users in database");
    }
    res.status(StatusCodes.OK).json({ users });
  }),

  getSingleUser: asyncWrapper(async (req, res, next) => {
    const { id: userId } = req.params;
    const { role, userId: currentUserId } = req.user;

    let user;
    if (role !== "admin" && currentUserId !== userId) {
      user = await User.findById(userId).select("-password -_id -email -__v");
    } else if (role !== "admin" && currentUserId === userId) {
      user = await User.findById(userId).select("-password");
    } else {
      user = await User.findById(userId).select("-password");
    }

    if (!user) {
      throw new CustomErrors.NotFoundError(`No item found with id: ${user}`);
    }
    res.status(StatusCodes.OK).json({ user });
  }),

  showCurrentUser: asyncWrapper(async (req, res, next) => {
    const currentUser = await User.findById(req.user.userId).select(
      "-password -__v"
    );
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

  followUser: asyncWrapper(async (req, res, next) => {
    const { id: encodedHashedId } = req.params;

    const userToFollow = await User.findOne({
      hashedId: encodedHashedId,
    });

    if (!userToFollow) {
      throw new CustomErrors.NotFoundError(
        `No item found with id: ${encodedHashedId}`
      );
    }

    const isHashedIdMatch = await userToFollow.compareHashedId(
      userToFollow._id.toString()
    );

    if (isHashedIdMatch === false) {
      throw new CustomErrors.UnauthorizedError("Couldn't verify credentials");
    }

    const currentUser = await User.findOne({
      _id: req.user.userId,
    });

    if (currentUser.hashedId === encodedHashedId) {
      throw new CustomErrors.BadRequestError("You cannot follow yourself!");
    }

    if (currentUser.following.includes(userToFollow.encodedHashedId)) {
      throw new CustomErrors.BadRequestError("You already following this user");
    }

    userToFollow.followers.push(req.user.encodedHashedId);
    currentUser.following.push(userToFollow.encodedHashedId);

    userToFollow.countFollowers = userToFollow.followers.length;
    currentUser.countFollowing = currentUser.following.length;

    await userToFollow.save();
    await currentUser.save();

    res.status(StatusCodes.OK).json({ msg: `Started following ` });
  }),

  unfollowUser: asyncWrapper(async (req, res, next) => {
    const { id: hashedId } = req.params;

    const userToUnfollow = await User.findById(hashedId);
    if (!userToUnfollow) {
      throw new CustomErrors.NotFoundError(
        `No item found with id: ${hashedId}`
      );
    }

    const currentUser = await User.findOne({ following: hashedId });

    if (!currentUser) {
      throw new CustomErrors.BadRequestError("You're not following this user");
    }

    await userToUnfollow.followers.pull(req.user.userId);
    await currentUser.following.pull(hashedId);

    userToUnfollow.countFollowers = userToUnfollow.followers.length;
    currentUser.countFollowing = currentUser.following.length;

    await userToUnfollow.save();
    await currentUser.save();

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
