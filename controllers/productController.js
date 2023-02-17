import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Product from "../models/Product.js";
import OwnedProduct from "../models/OwnedProduct.js";
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
    // const products = await Product.find({});
    let queryObject = {};
    const {
      featured,
      freeShipping,
      company,
      search,
      sort,
      sortOrder,
      fields,
      numericFilters,
    } = req.query;

    queryObject.featured = featured === "true" ? true : false;

    queryObject.freeShipping = freeShipping === "true" ? true : false;

    if (company) {
      queryObject.company = company;
    }

    if (search) {
      queryObject.name = { $regex: search, $options: "i" };
    }

    if (numericFilters) {
      const operatorMap = {
        ">": "$gt",
        ">=": "$gte",
        "=": "$eq",
        "<": "$lt",
        "<=": "$lte",
      };

      // regex to match word boundaries of each one of the matching symbols <, <=, =, >=, >
      const regEx = /\b(<|<=|=|>=|>)\b/g;

      // return an array. in cases when the user passes more than one numericFilters, split them by comma.
      let filters = numericFilters.split(",").reduce((acc, filter) => {
        // split every array item by the matching word boundaries, "price>20" will become ["price", ">", "20"]
        const [field, operator, value] = filter.split(regEx);
        if (["price", "averageRating", "numOfReviews"].includes(field)) {
          acc[field] = { [operatorMap[operator]]: Number(value) };
        }

        return acc;
      }, {});

      Object.assign(queryObject, filters);
    }

    let result = Product.find(queryObject);

    let sortObj = {};
    // sorting functionality that accepts more than one query parameter to sort by, separated by a comma.
    if (sort) {
      if (sort.split(",").length === 1) {
        // if sortOrder=desc query param is added, then sort by descending order. Works only if sort query param exists. Example: ?sort=price&sortOrder=desc
        sortObj[sort] = sortOrder === "desc" ? -1 : 1;
        result = result.sort(sortObj);
      } else {
        const sortArr = sort.split(",");
        sortObj = sortArr.reduce((acc, field) => {
          acc[field] = sortOrder === "desc" ? -1 : 1;

          return acc;
        }, {});
        result = result.sort(sortObj);
      }
    } else {
      result = result.sort("price");
    }

    // filter the result response by fields.
    if (fields) {
      const fieldsList = fields.split(",").join(" ");
      result = result.select(fieldsList);
    }

    // pagination. allow maximum 10 items per page.
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    result = result.skip(skip).limit(limit);

    const products = await result;

    res.status(StatusCodes.OK).json({
      products,
      count: products.length,
    });
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

      // error if no file selected.
      const { image } = req.files;
      if (!image) {
        throw new CustomErrors.BadRequestError(
          "To upload an image the key must be: image"
        );
      }

      // error if the file isn't an image.
      const productImage = req.files.image;
      if (!productImage.mimetype.startsWith("image")) {
        throw new CustomErrors.BadRequestError("Please upload image");
      }

      // error if the image is too large.
      const maxSize = 1000 * 1000 * 7;
      if (productImage.size > maxSize) {
        throw new CustomErrors.BadRequestError(
          "Image too big, max size is 7 MB"
        );
      }

      // upload to cloudinary.
      const result = await cloudinary.uploader.upload(
        productImage.tempFilePath,
        {
          use_filename: true,
          folder: "e-commerce-api",
        }
      );
      res.status(StatusCodes.OK).json({ imageSrc: result.secure_url });
    } finally {
      //remove the temporary folder in the end, both for success or failure.
      await fs.promises.rm(path.join(__dirname, "../tmp"), {
        recursive: true,
        force: true,
      });
    }
  }),

  getOwnedProducts: asyncWrapper(async (req, res, next) => {
    const { userId } = req.user;
    const ownedProducts = await OwnedProduct.findOne({ user: userId }).populate(
      {
        path: "products",
        select: "name image",
      }
    );
    if (ownedProducts.products.length === 0) {
      throw new CustomErrors.NotFoundError(
        "You currently don't own any products"
      );
    }

    res.status(StatusCodes.OK).json({ ownedProducts });
  }),
};

export default productControllers;
