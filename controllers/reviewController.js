import Review from "../models/Review.js";
import Product from "../models/product.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import CustomErrors from "../errors/error-index.js";
import { StatusCodes } from "http-status-codes";

const reviewControllers = {
  createReview: asyncWrapper(async (req, res, next) => {
    const { userId } = req.user;
    const { product: productId } = req.body;

    const isValidProduct = await Product.findById(productId);

    if (!isValidProduct) {
      throw new CustomErrors.NotFoundError(`No product with id: ${productId}`);
    }

    const alreadySubmitted = Review.findOne({
      product: productId,
      user: userId,
    });

    if (alreadySubmitted) {
      throw new CustomErrors.BadRequestError(
        "Already submitted review for this product"
      );
    }

    req.body.user = userId;
    const review = await Review.create(req.body);

    res.status(StatusCodes.CREATED).json({ review });
  }),

  getAllReviews: asyncWrapper(async (req, res, next) => {
    const reviews = await Review.find({});

    if (reviews.length === 0) {
      throw new CustomErrors.NotFoundError("There are no reviews");
    }

    res.status(StatusCodes.OK).json({ reviews });
  }),

  getSingleReview: asyncWrapper(async (req, res, next) => {
    const { id: productId } = req.params;

    if (!productId) {
      throw new CustomErrors.BadRequestError(
        `No product with id: ${productId}`
      );
    }

    const review = await Review.findOne({ product: productId });

    if (!review) {
      throw new CustomErrors.NotFoundError("No reviews found for this product");
    }

    res.status(StatusCodes.OK).json({ review });
  }),

  deleteReview: asyncWrapper(async (req, res, next) => {}),

  updateReview: asyncWrapper(async (req, res, next) => {}),
};

export default reviewControllers;
