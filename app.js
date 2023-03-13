import http from "http";
import { fileURLToPath } from "url";
import express from "express";
import connectDB from "./db/connectDB.js";
import sessionStore from "./utils/session-store.js";
import errorHandlerMiddleware from "./middleware/error-handler-middleware.js";
import resetPasswordHelper from "./utils/reset-password-helper.js";
import notFoundRoute from "./middleware/not-found-middleware.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import productRouter from "./routes/productRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { rateLimiter } from "./utils/utils.js";
import xss from "xss-clean";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import helmet from "helmet";
import crypto from "crypto";
import { limitRetries } from "./routes/authRoutes.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const server = express();
const addNonce = (req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
};

server.use(addNonce);

server.set("trust proxy", 1);

// ----- security middlewares -----

// global rate limiter
const fifteenMinutes = 15 * 60 * 1000;
const rateLimitErrorMessage =
  "Too many connection attempts, please come back later";
server.use(rateLimiter(fifteenMinutes, 40, rateLimitErrorMessage));

server.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
      },
    },
  })
);

server.use(cors());
server.use(xss());
server.use(mongoSanitize());

// ----- application specific middleware -----
server.use(express.json());
server.use(fileUpload({ useTempFiles: true }));
server.use(cookieParser(process.env.JWT_SECRET));
server.use(sessionStore());

// home page
server.use("/api/v1", express.static(__dirname + "public"));

// base route
const baseRoute = "/api/v1";

// ----- routes -----
server.use(baseRoute + "/auth", authRouter);
server.use(baseRoute + "/users", userRouter);
server.use(baseRoute + "/products", productRouter);
server.use(baseRoute + "/reviews", reviewRouter);
server.use(baseRoute + "/orders", orderRouter);

// reset password route
server.get(
  "/api/v1/auth/reset-page",
  limitRetries,
  resetPasswordHelper.requireResetToken,
  resetPasswordHelper.resetPasswordPage
);

// route for the reset password success page
server.get("/api/v1/auth/success-page", resetPasswordHelper.resetSuccessPage);

// ----- error handler & not found middleware -----
server.use(notFoundRoute);
server.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 8000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    http.createServer(server).listen(PORT, function () {
      console.info("Server is running on:", this.address());
    });
  } catch (error) {
    console.log(error);
  }
};

start();
