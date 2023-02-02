import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import { validatorMinMax } from "../utils/utils.js";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "Value must be provided"],
    validate: [
      validatorMinMax("minlength", 3),
      validatorMinMax("maxlength", 50),
    ],
    set: (val) => val.toLowerCase(),
  },

  username: {
    type: String,
    unique: true,
    trim: true,
    required: [true, "Value must be provided"],
    validate: [
      validatorMinMax("minlength", 4),
      validatorMinMax("maxlength", 20),
    ],
    set: (val) => val.toLowerCase(),
  },

  email: {
    type: String,
    unique: true,
    required: [true, "Value must be provided"],
    validate: {
      validator: validator.isEmail,
      message: "Please provide a valid email",
    },
    set: (val) => val.toLowerCase(),
  },

  password: {
    type: String,
    trim: true,
    required: [true, "Value must be provided"],
    validate: validatorMinMax("minlength", 6),
  },

  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },

  followers: [
    {
      type: String,
    },
  ],

  following: [
    {
      type: String,
    },
  ],

  countFollowers: {
    type: Number,
    default: 0,
  },

  countFollowing: {
    type: Number,
    default: 0,
  },
});

UserSchema.pre("save", async function () {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  // if a user changes his username, update all associated following & followers with that new username for all users.
  // happens only for when a user modifies the path username, except for when registering.
  if (this.isModified("username") && !this.isNew) {
    const previousUsername = (await User.findById(this._id)).username;

    // Update followers array
    await User.updateMany(
      { followers: previousUsername },
      { $set: { followers: this.username } }
    );

    // Update following array
    await User.updateMany(
      { following: previousUsername },
      { $set: { following: this.username } }
    );
  }

  //TODO -------------------> When a user changes his username, update all associated reviews posted by him, with that new username <---------------------- TODO
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

UserSchema.pre("remove", async function () {
  //Remove all reviews that are associated with that user to be deleted.
  await this.model("Review").deleteMany({ product: this._id });

  // Remove the deleted username from all associated followers & following users.
  // Update the countFollowers & countFollowing for all users who were associated with the deleted username.
  const update = {
    $pull: {
      followers: this.username,
      following: this.username,
    },
  };

  const followersSize = await User.aggregate([
    { $match: { followers: this.username } },
    { $project: { size: { $size: "$followers" } } },
  ]);

  const followingSize = await User.aggregate([
    { $match: { following: this.username } },
    { $project: { size: { $size: "$following" } } },
  ]);

  if (followersSize.length > 0) {
    update.$inc = {
      countFollowers: -followersSize[0].size,
    };
  }

  if (followingSize.length > 0) {
    update.$inc = {
      ...update.$inc,
      countFollowing: -followingSize[0].size,
    };
  }

  await User.updateMany(
    {
      $or: [
        {
          followers: this.username,
        },
        {
          following: this.username,
        },
      ],
    },
    update
  );
});

const User = mongoose.model("User", UserSchema);

export default User;
