import Order from "../models/order.js";
import Product from "../models/product.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import { StatusCodes } from "http-status-codes";
import CustomErrors from "../errors/error-index.js";
import checkPersmissions from "../utils/checkPermissions.js";

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
    const { cartItems, tax, shippingFee } = req.body;

    if (!cartItems || cartItems.length < 1) {
      throw new CustomErrors.BadRequestError("No cart items provided");
    }

    if (!tax || !shippingFee) {
      throw new CustomErrors.BadRequestError("Please provide value");
    }

    res.send("createOrder controller");
  }),

  updateOrder: asyncWrapper(async (req, res, next) => {
    res.send("updateOrder controller");
  }),
};

export default orderControllers;
