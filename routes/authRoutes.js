import authControllers from "../controllers/authController.js";
import express from "express";

const authRouter = express.Router();

authRouter.post("/register", authControllers.register);
authRouter.post("/login", authControllers.login);
authRouter.get("/logout", authControllers.logout);

export default authRouter;
