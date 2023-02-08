import mongoose from "mongoose";

const OwnedProductsSchema = new mongoose.Schema({
  products: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Product",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const OwnedProduct = mongoose.model("OwnedProduct", OwnedProductsSchema);

export default OwnedProduct;
