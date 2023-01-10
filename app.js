import http from "http";
import express from "express";
import connectDB from "./db/connectDB.js";
import errorHandlerMiddleware from "./middleware/error-handler-middleware.js";
import notFoundRoute from "./middleware/not-found-middleware.js";
import authRouter from "./routes/authRoutes.js";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const server = express();

// application specific middleware
server.use(morgan("tiny"));
server.use(express.json());

// routes
server.get("/", (req, res) => {
  res.send("Test the main route --->  /api/v1/auth");
});

server.use("/api/v1/auth", authRouter);

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
