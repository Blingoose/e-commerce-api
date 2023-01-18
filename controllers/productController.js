import Product from "../models/product.js";
import CustomErrors from "../errors/error-index.js";
import { StatusCodes } from "http-status-codes";
import asyncWrapper from "../middleware/asyncWrapper.js";

const productControllers = {
  createProduct: asyncWrapper(async (req, res, next) => {
    req.body.user = req.user.userId;
    const product = await Product.create(req.body);
    res.status(StatusCodes.CREATED).json({ product });
  }),

  getAllProducts: asyncWrapper(async (req, res, next) => {
    const products = await Product.find({});
    res.status(StatusCodes.OK).json({ products, count: products.length });
  }),

  getSingleProduct: asyncWrapper(async (req, res, next) => {
    const { id: productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      throw new CustomErrors.NotFoundError(
        `No product with id: ${productId} found`
      );
    }
    res.status(StatusCodes.OK).json({ product });
  }),

  deleteProduct: asyncWrapper(async (req, res, next) => {
    const { id: productId } = req.params;
    const removedProduct = await Product.findByIdAndRemove(productId);

    if (!removedProduct) {
      throw new CustomErrors.NotFoundError(
        `No product with id: ${productId} found`
      );
    }
    res.status(StatusCodes.OK).json({ removedProduct });
  }),

  updateProduct: asyncWrapper(async (req, res, next) => {
    const { id: productId } = req.params;
    req.body.user = req.user.userId;
    const product = await Product.findByIdAndUpdate(productId, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(StatusCodes.OK).json({ product });
  }),

  uploadImage: asyncWrapper(async (req, res, next) => {}),
};

export default productControllers;
