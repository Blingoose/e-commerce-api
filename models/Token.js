import mongoose from "mongoose";

const TokenSchema = new mongoose.Schema(
  {
    refreshToken: { type: String, required: true },

    ip: { type: String, required: true },

    userAgent: { type: String, required: true },

    isValid: { type: Boolean, default: true },

    status: {
      type: String,
      enum: ["active", "logged-out", "banned"],
      required: true,
      default: "active",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Token = mongoose.model("Token", TokenSchema);

export default Token;
