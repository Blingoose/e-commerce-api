import mongoose from "mongoose";

const OwnedProductsSchema = new mongoose.Schema({
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      index: true,
    },
  ],

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  isDocumentInitialized: {
    type: Boolean,
    default: false,
  },
});

const OwnedProduct = mongoose.model("OwnedProduct", OwnedProductsSchema);

export default OwnedProduct;
