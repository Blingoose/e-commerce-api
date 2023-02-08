import mongoose from "mongoose";
import OwnedProduct from "./OwnedProduct.js";

const SingleOrderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  image: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  name: {
    type: String,
    required: true,
  },

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  amount: {
    type: Number,
    required: true,
  },
});

const OrderSchema = new mongoose.Schema(
  {
    tax: {
      type: Number,
      required: [true, "Please provide value"],
    },

    shippingFee: {
      type: Number,
      required: [true, "Please provide value"],
    },

    // amount * price
    subtotal: {
      type: Number,
      required: true,
    },

    // tax + shippingFee + subtotal
    total: {
      type: Number,
      required: true,
    },

    orderItems: [SingleOrderItemSchema],

    status: {
      type: String,
      enum: ["pending", "failed", "paid", "delivered", "canceled"],
      default: "pending",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    clientSecret: {
      type: String,
      required: true,
    },

    paymentIntentId: {
      type: String,
    },
  },
  { timestamps: true }
);

// initialize OwnedProduct document when the user creates a order for the first time.
OrderSchema.post("save", async function () {
  const ownedProduct = await OwnedProduct.findOne({
    user: this.user,
  });

  if (!ownedProduct) {
    const initializeOwnedProductDocument = new OwnedProduct({
      user: this.user,
      products: [],
    });
    await initializeOwnedProductDocument.save();
  }
});

const Order = mongoose.model("Order", OrderSchema);

export default Order;
