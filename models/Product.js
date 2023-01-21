import mongoose from "mongoose";
import { createVirtualField, validatorMinMax } from "../utils/utils.js";

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Please provide a value"],
      validate: validatorMinMax("maxlength", 100),
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
    },

    image: {
      type: String,
      default: "/uploads/example.svg",
    },

    category: {
      type: String,
      required: [true, "Please provide a value"],
      enum: ["office", "kitchen", "bedroom"],
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
      default: 15,
    },

    averageRating: {
      type: Number,
      default: 0,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestaps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//this enables the use of populate("reviews") in the getSingleProduct - to show all reviews for a single product.
createVirtualField(ProductSchema, "reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
});

const Product = mongoose.model("Product", ProductSchema);
export default Product;
