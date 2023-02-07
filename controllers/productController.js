import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Product from "../models/Product.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import { StatusCodes } from "http-status-codes";
import CustomErrors from "../errors/error-index.js";
import { v2 as cloudinary } from "cloudinary";

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
    const product = await Product.findById(productId).populate("reviews");

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
    try {
      if (!req.files) {
        throw new CustomErrors.BadRequestError("No file uploaded");
      }

      // error if no file selected
      const { image } = req.files;
      if (!image) {
        throw new CustomErrors.BadRequestError(
          "To upload an image the key must be: image"
        );
      }

      // error if the file isn't an image
      const productImage = req.files.image;
      if (!productImage.mimetype.startsWith("image")) {
        throw new CustomErrors.BadRequestError("Please upload image");
      }

      // error if the image is too large
      const maxSize = 1000 * 1000 * 7;
      if (productImage.size > maxSize) {
        throw new CustomErrors.BadRequestError(
          "Image too big, max size is 7 MB"
        );
      }

      // upload to cloudinary
      const result = await cloudinary.uploader.upload(
        productImage.tempFilePath,
        {
          use_filename: true,
          folder: "e-commerce-api",
        }
      );
      res.status(StatusCodes.OK).json({ imageSrc: result.secure_url });
    } finally {
      //remove the temporary image in the end, both for success or failure
      fs.rmSync(path.join(__dirname, "../tmp"), {
        recursive: true,
        force: true,
      });
    }
  }),
};

export default productControllers;
