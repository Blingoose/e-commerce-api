import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import { validatorMinMax } from "../utils/utils.js";
import CustomErrors from "../errors/error-index.js";
import { StatusCodes } from "http-status-codes";

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
    type: String,
    default: 0,
  },

  countFollowing: {
    type: String,
    default: 0,
  },
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

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
      { $set: { "followers.$": this.username } }
    );

    // Update following array
    await User.updateMany(
      { following: previousUsername },
      { $set: { "following.$": this.username } }
    );

    //When user changes his username, update all associated reviews posted by him, with that new username
    await this.model("Review").updateMany(
      { username: previousUsername },
      { $set: { username: this.username } }
    );
  }
});

UserSchema.pre("remove", async function () {
  //Remove all reviews that are associated with that user to be deleted.
  await this.model("Review").deleteMany({ product: this._id });

  // Remove the deleted username from all associated followers & following users &&
  // update the countFollowers & countFollowing for all users who were associated with the deleted username.
  const deletedUsername = this.username;

  const operations = [
    {
      updateMany: {
        filter: { followers: deletedUsername },
        update: {
          $pull: { followers: deletedUsername },
          $inc: { countFollowers: -1 },
        },
      },
    },
    {
      updateMany: {
        filter: { following: deletedUsername },
        update: {
          $pull: { following: deletedUsername },
          $inc: { countFollowing: -1 },
        },
      },
    },
  ];

  // If some of the bulk writes fail, it'll be retried 5 times.

  let success = false;
  let retries = 0;
  const maxRetries = 5;
  const retryInterval = 500;

  while (!success && retries < maxRetries) {
    try {
      await User.collection.bulkWrite(operations, {
        ordered: true,
        forceServerObjectId: false,
      });
      success = true;
    } catch (error) {
      retries += 1;

      console.error(
        `Write failed, retrying in ${retryInterval}ms (${retries}/${maxRetries})`
      );

      //retry again ONLY after the timeout has ended.
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }
  }

  if (!success) {
    throw new CustomErrors.CreateCustomError(
      "Failed to write to the database after multiple retries",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
});

const User = mongoose.model("User", UserSchema);

export default User;
