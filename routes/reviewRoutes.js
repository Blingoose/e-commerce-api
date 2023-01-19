import express from "express";
import { authenticateUser } from "../middleware/authentication-middleware.js";
import reviewControllers from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter
  .route("/:id")
  .post(authenticateUser, reviewControllers.createReview);

export default reviewRouter;
