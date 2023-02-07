import Review from "../models/Review.js";
import Product from "../models/Product.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import CustomErrors from "../errors/error-index.js";
import { StatusCodes } from "http-status-codes";
import checkPermission from "../utils/checkPermissions.js";
import { model } from "mongoose";

const reviewControllers = {
  createReview: asyncWrapper(async (req, res, next) => {
    const { userId, username } = req.user;
    const { product: productId } = req.body;

    const isValidProduct = await Product.findById(productId);

    if (!isValidProduct) {
      throw new CustomErrors.NotFoundError(`No product with id: ${productId}`);
    }

    const alreadySubmitted = await Review.findOne({
      product: productId,
      user: userId,
    });

    if (alreadySubmitted) {
      throw new CustomErrors.BadRequestError(
        "Already submitted review for this product"
      );
    }

    req.body.user = userId;
    req.body.username = username;

    const review = await Review.create(req.body);

    res.status(StatusCodes.CREATED).json({ review });
  }),

  getAllReviews: asyncWrapper(async (req, res, next) => {
    const reviews = await Review.find({}).populate({
      path: "product",
      select: "name company price",
    });

    if (reviews.length === 0) {
      throw new CustomErrors.NotFoundError("There are no reviews");
    }

    res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
  }),

  getSingleReview: asyncWrapper(async (req, res, next) => {
    const { id: reviewId } = req.params;
    const review = await Review.findById(reviewId).populate({
      path: "product",
      select: "name company price",
    });

    if (!review) {
      throw new CustomErrors.NotFoundError(`No review with id: ${reviewId}`);
    }

    res.status(StatusCodes.OK).json({ review });
  }),

  deleteReview: asyncWrapper(async (req, res, next) => {
    const { id: reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new CustomErrors.NotFoundError(`No review with id: ${reviewId}`);
    }

    checkPermission(req.user, review.user.toString(), reviewId);

    await review.remove();

    res.status(StatusCodes.OK).json({ removed: review });
  }),

  updateReview: asyncWrapper(async (req, res, next) => {
    const { id: reviewId } = req.params;
    const { title, comment, rating } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      throw new CustomErrors.NotFoundError(`No review with id: ${reviewId}`);
    }

    checkPermission(req.user, review.user.toString(), reviewId);

    review.title = title || review.title;
    review.comment = comment || review.comment;
    review.rating = rating || review.rating;

    await review.save();

    res.status(StatusCodes.OK).json({ review });
  }),

  getSingleProductReviews: asyncWrapper(async (req, res, next) => {
    const { id: productId } = req.params;
    const reviews = await Review.find({ product: productId });

    if (reviews.length === 0) {
      throw new CustomErrors.NotFoundError(
        "There are no reviews for this product"
      );
    }

    res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
  }),
};

export default reviewControllers;
