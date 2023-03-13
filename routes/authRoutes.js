import authControllers from "../controllers/authController.js";
import express from "express";
import { authenticateUser } from "../middleware/authentication-middleware.js";
import { rateLimiter } from "../utils/utils.js";

const authRouter = express.Router();

const fifteenMinutes = 15 * 16 * 1000;
const limitErrorMesage = "Too many attempts, try again later";
const limitRetries = rateLimiter(fifteenMinutes, 3, limitErrorMesage);

authRouter.post("/register", authControllers.register);
authRouter.post("/login", authControllers.login);
authRouter.delete("/logout", authenticateUser, authControllers.logout);
authRouter.get("/verify-email", limitRetries, authControllers.verifyEmail);
authRouter.post("/reset-password", limitRetries, authControllers.resetPassword);
authRouter.post("/forgot-password", authControllers.forgotPassword);

export default authRouter;
