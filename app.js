import http from "http";
import express from "express";
import connectDB from "./db/connectDB.js";
import dotenv from "dotenv";
dotenv.config();

const server = express();
const PORT = process.env.PORT || 8000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    server.get("/", (req, res) => {
      res.send("Hello World!");
    });

    http.createServer(server).listen(PORT, function () {
      console.info("Server is running on:", this.address());
    });
  } catch (error) {
    console.log(error);
  }
};

start();
