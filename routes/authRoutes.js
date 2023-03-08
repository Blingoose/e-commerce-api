import authControllers from "../controllers/authController.js";
import express from "express";
import { authenticateUser } from "../middleware/authentication-middleware.js";

const authRouter = express.Router();

authRouter.post("/register", authControllers.register);
authRouter.post("/login", authControllers.login);
authRouter.delete("/logout", authenticateUser, authControllers.logout);
authRouter.get("/verify-email", authControllers.verifyEmail);
authRouter.get("/reset-page", authControllers.resetPasswordPage);
authRouter.post("/reset-password", authControllers.resetPassword);
authRouter.post("/forgot-password", authControllers.forgotPassword);

export default authRouter;
