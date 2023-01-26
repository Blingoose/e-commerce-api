import Order from "../models/order.js";
import Product from "../models/product.js";
import CustomErrors from "../errors/error-index.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import checkPersmissions from "../utils/checkPermissions.js";
import { v4 } from "uuid";
import { StatusCodes } from "http-status-codes";

const fakeStripeAPI = async ({ amount, currency }) => {
  const currencyConverter = {
    usd: amount / 100,
    ils: amount * 0.033791,
    eur: amount * 0.0091615,
  };

  if (!currencyConverter.hasOwnProperty(currency)) {
    throw new CustomErrors.BadRequestError("Wrong currency");
  }

  const convertedAmount = currencyConverter[currency];

  const client_secret = v4();
  return { client_secret, amount: convertedAmount, currency };
};

const orderControllers = {
  createOrder: asyncWrapper(async (req, res, next) => {
    const { cartItems, tax, shippingFee } = req.body;

    if (!cartItems || cartItems.length < 1) {
      throw new CustomErrors.BadRequestError("No cart items provided");
    }

    let orderItems = [];
    let subtotal = 0;
    let total = 0;

    for (const item of cartItems) {
      const product = await Product.findById(item.product);

      if (!product) {
        throw new CustomErrors.NotFoundError(
          `No product with id: ${item.product}`
        );
      }
      const { name, price, image, _id } = product;

      const singleOrderItem = {
        amount: item.amount,
        name,
        price,
        image,
        product: _id,
      };

      // add item to order
      orderItems = [...orderItems, singleOrderItem];
      subtotal += item.amount * price;
    }

    total = tax + shippingFee + subtotal;
    if (!total) {
      // if one of the required fields is missing or can't be summed up
      total = 0;
    }

    //get client secret
    const paymentIntent = await fakeStripeAPI({
      amount: total,
      currency: "ils",
    });

    const order = await Order.create({
      orderItems,
      total,
      subtotal,
      tax,
      shippingFee,
      clientSecret: paymentIntent.client_secret,
      user: req.user.userId,
    });

    res.status(StatusCodes.CREATED).json({
      order,
      clientSecret: order.clientSecret,
      currency: paymentIntent.currency,
      [`converted total to ${paymentIntent.currency}`]:
        paymentIntent.amount.toFixed(2),
    });
  }),

  getAllOrders: asyncWrapper(async (req, res, next) => {
    res.send("getAllOrders controller");
  }),

  getSingleOrder: asyncWrapper(async (req, res, next) => {
    res.send("getSingleOrder controller");
  }),

  getCurrentUserOrders: asyncWrapper(async (req, res, next) => {
    res.send("getCurrentUserOrders controller");
  }),

  updateOrder: asyncWrapper(async (req, res, next) => {
    res.send("updateOrder controller");
  }),
};

export default orderControllers;
