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
    const insufficientInventory = { notEnoughInventory: [], outOfStock: [] };
    let inventorySufficient = true;
    const productIds = new Set();

    for (const item of cartItems) {
      const product = await Product.findById(item.product);

      if (!product) {
        throw new CustomErrors.NotFoundError(
          `No product found with id: ${item.product}`
        );
      }

      // check if cartItems in req.body contain the same product more than once.
      if (productIds.has(item.product)) {
        throw new CustomErrors.BadRequestError(
          "You cannot add the same product twice to the cart items "
        );
      }
      productIds.add(item.product);

      // check if any order product is out of stock or the requested amount is greated than the amount in the inventory.
      if (product.inventory === 0) {
        insufficientInventory.outOfStock.push({
          id: item.product,
          name: product.name,
          requestedAmount: item.amount,
          inventory: product.inventory,
        });
        inventorySufficient = false;
      } else if (product.inventory - item.amount < 0) {
        insufficientInventory.notEnoughInventory.push({
          id: item.product,
          name: product.name,
          requestedAmount: item.amount,
          inventory: product.inventory,
        });
        inventorySufficient = false;
      } else if (inventorySufficient) {
        const { name, price, image, _id } = product;

        const singleOrderItem = {
          amount: item.amount,
          name,
          price,
          image,
          product: _id,
        };

        // add item to order.
        orderItems = [...orderItems, singleOrderItem];
        subtotal += item.amount * price;
      }
    }

    // throw error if any of the insufficient properties contains at least one item in its array.
    if (!inventorySufficient) {
      throw new CustomErrors.InventoryError(insufficientInventory);
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
      currency: "usd",
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

    // update ordered products inventory.
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      product.inventory -= item.amount;
      await product.save();
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
    const { paymentIntentId, status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      throw new CustomErrors.NotFoundError(
        `No order found with id: ${orderId}`
      );
    }
    checkPermission(req.user, order.user.toString(), orderId);

    if (status === "pending") {
      throw new CustomErrors.BadRequestError(
        "You are not allowed to revert the status to 'pending'. You can only choose between: canceled, failed, paid or delivered"
      );
    }

    // prevent from updating to the same status that's already set.
    const previousStatus = order.status;
    if (previousStatus === status) {
      throw new CustomErrors.BadRequestError(
        `Status is already set to --> ${status}`
      );
    }

    // increase or decrease inventory based on order update status.
    // make sure to keep inventory numbers as they are when updating from paid to delivered or from canceled to failed and (vise versa).
    if (
      (status === "canceled" && previousStatus !== "failed") ||
      (status === "failed" && previousStatus !== "canceled")
    ) {
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        product.inventory += item.amount;
        await product.save();
      }
    } else if (
      (status === "paid" &&
        previousStatus !== "delivered" &&
        previousStatus !== "pending") ||
      (status === "delivered" &&
        previousStatus !== "paid" &&
        previousStatus !== "pending")
    ) {
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        product.inventory -= item.amount;
        await product.save();
      }
    }

    order.paymentIntentId = paymentIntentId;
    order.status = status;
    await order.save();

    if (status === "paid" || status === "delivered") {
      await OwnedProduct.updateOne(
        { user: req.user.userId },
        {
          $addToSet: {
            products: order.orderItems.map((item) => item.product),
          },
        }
      );
    } else if (status === "canceled" || status === "failed") {
      const alreadyOwnedProducts = await Order.find({
        user: req.user.userId,
        status: { $in: ["paid", "delivered"] },
        "orderItems.product": {
          $in: order.orderItems.map((item) => item.product),
        },
        _id: { $ne: order._id },
      });

      console.log(alreadyOwnedProducts);
      // Create an array of all the product ids that are already owned by the user.
      // Convert alreadyOwnedProducts to a single array of only product IDs
      const productIds = [];

      for (const order of alreadyOwnedProducts) {
        for (const item of order.orderItems) {
          productIds.push(item.product);
        }
      }
      await OwnedProduct.updateOne(
        { user: req.user.userId },
        {
          $pull: {
            products: {
              $nin: productIds,
            },
          },
        }
      );
    }
    res.status(StatusCodes.OK).json({ order });
  }),
};

export default orderControllers;
