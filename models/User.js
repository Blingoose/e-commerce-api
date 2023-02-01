import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import { validatorMinMax } from "../utils/utils.js";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Value must be provided"],
    validate: [
      validatorMinMax("minlength", 3),
      validatorMinMax("maxlength", 50),
    ],
  },

  email: {
    type: String,
    unique: true,
    required: [true, "Value must be provided"],
    validate: {
      validator: validator.isEmail,
      message: "Please provide a valid email",
    },
  },

  password: {
    type: String,
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
  // console.log(this.modifiedPaths());
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

UserSchema.pre("remove", async function () {
  //Remove all reviews that are associated with that user to be deleted.
  await this.model("Review").deleteMany({ product: this._id });
  // Remove the deleted user's id from other users' followers array
  await User.updateMany(
    { followers: this._id },
    {
      $pull: { followers: this._id.toString() },
      $inc: { countFollowers: -1 },
    }
  );
});

const User = mongoose.model("User", UserSchema);

export default User;
