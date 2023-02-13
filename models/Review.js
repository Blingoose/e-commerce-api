import mongoose from "mongoose";
import { ratingMinMax, validatorMinMax } from "../utils/utils.js";

const ReviewSchema = new mongoose.Schema(
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
      set: (val) => val.toLowerCase(),
    },

    comment: {
      type: String,
      trim: true,
      required: [true, "Please provide value"],
      validate: validatorMinMax("maxlength", 200),
      set: (val) => val.toLowerCase(),
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    username: {
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

ReviewSchema.statics.calcAvgRatingAndNumOfReviews = async function (productId) {
  const result = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        numOfReviews: { $sum: 1 },
      },
    },
    {
      $project: {
        averageRating: { $round: ["$averageRating", 1] },
        numOfReviews: 1,
      },
    },
  ]);

  try {
    await this.model("Product").findOneAndUpdate(
      { _id: productId },
      {
        numOfReviews: result[0]?.numOfReviews || 0,
        averageRating: result[0]?.averageRating || 0,
      }
    );
  } catch (error) {
    console.log(error);
  }
};

ReviewSchema.post("save", async function () {
  await this.constructor.calcAvgRatingAndNumOfReviews(this.product);
});

ReviewSchema.post("remove", async function () {
  await this.constructor.calcAvgRatingAndNumOfReviews(this.product);
});

const Review = mongoose.model("Review", ReviewSchema);

export default Review;
