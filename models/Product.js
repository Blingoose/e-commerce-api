import mongoose from "mongoose";
import { createVirtualField, validatorMinMax } from "../utils/utils.js";

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Please provide a value"],
      validate: validatorMinMax("maxlength", 100),
      set: (val) => val.toLowerCase(),
    },

    price: {
      type: Number,
      required: [true, "Please provide a value"],
      default: 0,
    },

    description: {
      type: String,
      required: [true, "Please provide some info about the product"],
      validate: validatorMinMax("maxlength", 1000),
      set: (val) => val.toLowerCase(),
    },

    image: {
      type: String,
      default:
        "https://res.cloudinary.com/dwsodcnc4/image/upload/v1675717646/e-commerce-api/example_irjybr.svg",
    },

    category: {
      type: String,
      required: [true, "Please provide a value"],
      enum: {
        values: [
          "office",
          "kitchen",
          "bedroom",
          "outdoor",
          "storage",
          "kids",
          "bathroom",
          "decor",
          "lighting",
        ],
        message: "{VALUE} is not supported",
      },
    },

    company: {
      type: String,
      required: [true, "Please provide a value"],
      enum: {
        values: ["ikea", "liddy", "marcos"],
        message: "{VALUE} is not supported",
      },
    },

    colors: {
      type: [String],
      required: true,
      default: ["#000"],
      set: (val) => val.map((color) => color.toLowerCase()),
    },

    featured: {
      type: Boolean,
      default: false,
    },

    freeShipping: {
      type: Boolean,
      default: false,
    },

    inventory: {
      type: Number,
      required: true,
      default: 100,
    },

    averageRating: {
      type: Number,
      default: 0,
    },

    numOfReviews: {
      type: Number,
      default: 0,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//this enables the use of populate("reviews") in the getSingleProduct - to show all reviews for a single product.
createVirtualField(ProductSchema, "reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
});

// Before a product is removed, delete all associated reviews.
ProductSchema.pre("remove", async function () {
  await this.model("Review").deleteMany({ product: this._id });
});

const Product = mongoose.model("Product", ProductSchema);
export default Product;
