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
    type: Number,
    default: 0,
  },

  countFollowing: {
    type: Number,
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
      { followers: { $in: [previousUsername] } },
      { $set: { "followers.$": this.username } }
    );

    // Update following array
    await User.updateMany(
      { following: { $in: [previousUsername] } },
      { $set: { "following.$": this.username } }
    );

    //When user changes his username, update all associated reviews posted by him, with that new username
    await this.model("Review").updateMany(
      { username: previousUsername },
      { $set: { username: this.username } }
    );
  }
});

// update numOfReviews and averageRating for each product that was previously reviewed by the deleted user, since all associated reviews are deleted too.
UserSchema.pre("remove", async function () {
  // Find all reviews posted by the deleted user
  const reviews = await this.model("Review").find({ user: this._id });

  //Remove all reviews that are associated with that user to be deleted.
  await this.model("Review").deleteMany({ username: this.username });

  // Group the reviews by product and calculate the average rating and number of reviews
  const aggregateResults = await this.model("Review").aggregate([
    {
      $match: {
        product: { $in: reviews.map((review) => review.product) },
      },
    },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        numOfReviews: { $sum: 1 },
      },
    },
  ]);

  // Update all the products associated to the deleted user with the new average rating and number of reviews.
  await this.model("Product").bulkWrite(
    [
      {
        updateMany: {
          filter: {
            _id: reviews.map((result) => result.product),
          },
          update: {
            averageRating: aggregateResults[0]?.averageRating || 0,
            numOfReviews: aggregateResults[0]?.numOfReviews || 0,
          },
        },
      },
    ],
    { ordered: true, forceServerObjectId: false }
  );

  // Remove the deleted username from all associated followers & following users &&
  // update the countFollowers & countFollowing for all users who were associated with the deleted username.
  const deletedUsername = this.username;

  const operations = [
    {
      updateMany: {
        filter: { followers: { $in: [deletedUsername] } },
        update: {
          $pull: { followers: deletedUsername },
          $inc: { countFollowers: -1 },
        },
      },
    },
    {
      updateMany: {
        filter: { following: { $in: [deletedUsername] } },
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
