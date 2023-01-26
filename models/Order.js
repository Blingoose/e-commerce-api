import mongoose from "mongoose";

const SingleOrderItemSchema = mongoose.Schema({
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
});

const OrderSchema = mongoose.Schema(
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

    paymentId: {
      type: String,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", OrderSchema);

export default Order;
