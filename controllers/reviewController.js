import Review from "../models/Review.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import CustomErrors from "../errors/error-index.js";
import { StatusCodes } from "http-status-codes";

const reviewControllers = {
  createReview: asyncWrapper(async (req, res, next) => {
    const { id: productId } = req.params;
    const { userId } = req.user;

    if (!productId) {
      throw new CustomErrors.NotFoundError(`No product with id: ${productId}`);
    }

    req.body.user = userId;
    req.body.product = productId;

    const review = await Review.create(req.body);

    res.status(StatusCodes.CREATED).json({ review });
  }),

  getAllReviews: asyncWrapper(async (req, res, next) => {}),

  getSingleReview: asyncWrapper(async (req, res, next) => {}),

  deleteReview: asyncWrapper(async (req, res, next) => {}),

  updateReview: asyncWrapper(async (req, res, next) => {}),
};

export default reviewControllers;
