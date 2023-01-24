import Order from "../models/Order.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import { StatusCodes } from "http-status-codes";
import CustomErrors from "../errors/error-index.js";

const orderControllers = {
  getAllOrders: asyncWrapper(async (req, res, next) => {
    res.send("getAllOrders controller");
  }),

  getSingleOrder: asyncWrapper(async (req, res, next) => {
    res.send("getSingleOrder controller");
  }),

  getCurrentUserOrders: asyncWrapper(async (req, res, next) => {
    res.send("getCurrentUserOrders controller");
  }),

  createOrder: asyncWrapper(async (req, res, next) => {
    res.send("createOrder controller");
  }),

  updateOrder: asyncWrapper(async (req, res, next) => {
    res.send("updateOrder controller");
  }),
};

export default orderControllers;
