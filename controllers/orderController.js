import Order from "../models/Order.js";
import Product from "../models/Product.js";
import OwnedProduct from "../models/OwnedProduct.js";
import CustomErrors from "../errors/error-index.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import checkPermission from "../utils/checkPermissions.js";
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
    const outOfStockProducts = [];

    for (const item of cartItems) {
      const product = await Product.findById(item.product);

      if (!product) {
        throw new CustomErrors.NotFoundError(
          `No product found with id: ${item.product}`
        );
      }

      if (product.inventory - item.amount >= 0 || product.inventory === 0) {
        outOfStockProducts.push(item.product);
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

    if (outOfStockProducts.length > 1) {
      throw new CustomErrors.BadRequestError(
        `Unfortunately, these product id's are out of stock: ${outOfStockProducts}`
      );
    } else if (outOfStockProducts === 1) {
      throw new CustomErrors.BadRequestError(
        `Unfortunately, this product id is out of stock: ${outOfStockProducts}`
      );
    }

    total = tax + shippingFee + subtotal;
    if (!total) {
      // setting total = 0 will remove the weird error message for that field if one of the required fields is missing or can't be summed up.
      // it's not necessary, but I think it's more elegant to hide from the error response.
      total = 0;
    }

    //get client secret
    const paymentIntent = await fakeStripeAPI({
      amount: total,
      currency: "ils",
    });

    const order = new Order({
      orderItems,
      total,
      subtotal,
      tax,
      shippingFee,
      clientSecret: paymentIntent.client_secret,
      user: req.user.userId,
    });

    await order.save();

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      product.inventory -= item.amount;
      product.save();
    }

    res.status(StatusCodes.CREATED).json({
      order,
      clientSecret: order.clientSecret,
      currency: paymentIntent.currency,
      [`converted total to ${paymentIntent.currency}`]:
        paymentIntent.amount.toFixed(2),
    });
  }),

  getAllOrders: asyncWrapper(async (req, res, next) => {
    const orders = await Order.find({});

    if (orders.length === 0) {
      throw new CustomErrors.NotFoundError("There are no orders right now");
    }
    res.status(StatusCodes.OK).json({ orders, count: orders.length });
  }),

  getSingleOrder: asyncWrapper(async (req, res, next) => {
    const { id: orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      throw new CustomErrors.NotFoundError(
        `No order found with id: ${orderId}`
      );
    }

    checkPermission(req.user, order.user.toString(), orderId);

    res.status(StatusCodes.OK).json({ order });
  }),

  getCurrentUserOrders: asyncWrapper(async (req, res, next) => {
    const orders = await Order.find({ user: req.user.userId });

    if (orders.length === 0) {
      throw new CustomErrors.NotFoundError("No orders");
    }

    res.status(StatusCodes.OK).json({ orders, count: orders.length });
  }),

  updateOrder: asyncWrapper(async (req, res, next) => {
    const { id: orderId } = req.params;
    const { paymentIntentId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      throw new CustomErrors.NotFoundError(
        `No order found with id: ${orderId}`
      );
    }
    checkPermission(req.user, order.user.toString(), orderId);

    order.paymentIntentId = paymentIntentId;
    order.status = "paid";

    await order.save();

    // update owned products
    await OwnedProduct.updateOne(
      { user: req.user.userId },
      {
        $addToSet: {
          products: order.orderItems.map((item) => item.product),
        },
      }
    );

    res.status(StatusCodes.OK).json({ order });
  }),
};

export default orderControllers;
