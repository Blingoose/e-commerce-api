import express from "express";
import productControllers from "../controllers/productController.js";
import {
  authenticateUser,
  authorizePermissions,
} from "../middleware/authentication-middleware.js";

const productRouter = express.Router();

productRouter
  .route("/")
  .post(
    authenticateUser,
    authorizePermissions("admin", "owner"),
    productControllers.createProduct
  )
  .get(productControllers.getAllProducts);

productRouter
  .route("/uploadImage")
  .post(
    authenticateUser,
    authorizePermissions("admin", "owner"),
    productControllers.uploadImage
  );

productRouter
  .route("/:id")
  .get(productControllers.getSingleProduct)
  .patch(
    authenticateUser,
    authorizePermissions("admin", "owner"),
    productControllers.updateProduct
  )
  .delete(
    authenticateUser,
    authorizePermissions("admin", "owner"),
    productControllers.deleteProduct
  );

export default productRouter;
