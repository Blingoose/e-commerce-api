import mongoose from "mongoose";
import { validatorMinMax } from "../utils/utils.js";

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Please provide product name"],
      validate: validatorMinMax("maxlength", 100),
    },

    price: {
      type: Number,
      required: [true, "Please provide product price"],
      default: 0,
    },

    description: {
      type: String,
      required: [true, "Please provide product description"],
      validate: validatorMinMax("maxlength", 1000),
    },

    image: {
      type: String,
      default: "/uploads/example.jpeg",
    },

    category: {
      type: String,
      required: [true, "Please provide product category"],
      enum: ["office", "kitchen", "bedroom"],
    },

    company: {
      type: String,
      required: [true, "Please provide company"],
      enum: {
        values: ["ikea", "liddy", "marcos"],
        message: "{VALUE} is not supported",
      },
    },

    colors: {
      type: [String],
      required: true,
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestaps: true }
);

const Product = mongoose.model("Product", ProductSchema);
export default Product;
