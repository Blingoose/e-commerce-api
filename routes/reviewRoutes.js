import express from "express";
import { authenticateUser } from "../middleware/authentication-middleware.js";
import reviewControllers from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter
  .route("/")
  .get(reviewControllers.getAllReviews)
  .post(authenticateUser, reviewControllers.createReview);

reviewRouter
  .route("/:id")
  .get(reviewControllers.getSingleReview)
  .patch(authenticateUser, reviewControllers.updateReview)
  .delete(authenticateUser, reviewControllers.deleteReview);

export default reviewRouter;
