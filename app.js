import http from "http";
import express from "express";
import connectDB from "./db/connectDB.js";
import errorHandlerMiddleware from "./middleware/error-handler-middleware.js";
import notFoundRoute from "./middleware/not-found-middleware.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const server = express();

// application specific middleware
server.use(morgan("tiny"));
server.use(express.json());
server.use(cookieParser(process.env.JWT_SECRET));

server.get("/", (req, res) => {
  res.send("Test the main route --->  /api/v1/auth");
});

//! TO REMOVE LATER (for testing purposes)
server.get("/api/v1", (req, res) => {
  console.log(req.signedCookies);
  res.send("Test cookies");
});

// routes
server.use("/api/v1/auth", authRouter);
server.use("/api/v1/users", userRouter);

// error handler & not found middleware
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
