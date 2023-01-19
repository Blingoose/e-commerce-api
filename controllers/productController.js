import path from "path";
import { fileURLToPath } from "url";
import Product from "../models/product.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import { StatusCodes } from "http-status-codes";
import CustomErrors from "../errors/error-index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

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
    const product = await Product.findById(productId);

    if (!product) {
      throw new CustomErrors.NotFoundError(
        `No product with id: ${productId} found`
      );
    }
    await product.remove();

    res.status(StatusCodes.OK).json({ removed: product });
  }),

  updateProduct: asyncWrapper(async (req, res, next) => {
    const { id: productId } = req.params;
    req.body.user = req.user.userId;
    const product = await Product.findByIdAndUpdate(productId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      throw new CustomErrors.NotFoundError(
        `No product with id: ${productId} found`
      );
    }

    res.status(StatusCodes.OK).json({ product });
  }),

  uploadImage: asyncWrapper(async (req, res, next) => {
    // console.log(req.files);
    if (!req.files) {
      throw new CustomErrors.BadRequestError("No file uploaded");
    }

    const productImage = req.files.image;
    if (!productImage.mimetype.startsWith("image")) {
      throw new CustomErrors.BadRequestError("Please upload image");
    }

    const maxSize = 1000 * 1000 * 7;
    if (productImage.size > maxSize) {
      throw new CustomErrors.BadRequestError("Image too big, max size is 7 MB");
    }

    const imagePath = path.join(
      __dirname,
      `../public/uploads/${productImage.name}`
    );
    await productImage.mv(imagePath);

    res.status(StatusCodes.OK).json({ image: `/uploads/${productImage.name}` });
  }),
};

export default productControllers;
