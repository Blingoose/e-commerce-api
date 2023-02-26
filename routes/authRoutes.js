import authControllers from "../controllers/authController.js";
import express from "express";

const authRouter = express.Router();

authRouter.post("/register", authControllers.register);
authRouter.post("/login", authControllers.login);
authRouter.get("/logout", authControllers.logout);
authRouter.get("/verify-email", authControllers.verifyEmail);

export default authRouter;
