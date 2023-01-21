import mongoose from "mongoose";
import { ratingMinMax, validatorMinMax } from "../utils/utils.js";

const ReviewSchema = mongoose.Schema(
  {
    rating: {
      type: Number,
      validate: [ratingMinMax("min", 1), ratingMinMax("max", 5)],
      required: [true, "Please provide value"],
    },

    title: {
      type: String,
      trim: true,
      required: [true, "Please provide value"],
      validate: validatorMinMax("maxlength", 80),
    },

    comment: {
      type: String,
      trim: true,
      required: [true, "Please provide value"],
      validate: validatorMinMax("maxlength", 200),
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userName: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true }
);

//making sure a user can only leave one review per product.
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

const Review = mongoose.model("Review", ReviewSchema);

export default Review;
