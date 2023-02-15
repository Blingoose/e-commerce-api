import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import OwnedProduct from "../models/OwnedProduct.js";
import CustomErrors from "../errors/error-index.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import { StatusCodes } from "http-status-codes";
import checkPermission from "../utils/checkPermissions.js";
import { v4 } from "uuid";
import mongoose from "mongoose";

// stripe payment simulation.
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

    // Increase or decrease inventory based on order update status.
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

    // Add products to the ownedProducts collection if order status is set as "paid" or "delivered" (without duplicates).
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
      // If the user sets the order status to canceled right after it was set to "paid" or "delivered",
      // we want to remove order items from the ownedProducts collection, but only if they weren't paid for in previous orders.
      const userObjectId = mongoose.Types.ObjectId(req.user.userId);

      // Create an array of all product ids owned by the user, which are associated with current order products,
      // with the status set as "paid" or "delivered" (current order excluded).
      const alreadyOwnedProducts = await Order.aggregate([
        {
          $match: {
            user: userObjectId,
            status: { $in: ["paid", "delivered"] },
            "orderItems.product": {
              $in: order.orderItems.map((item) => item.product),
            },
            _id: { $ne: order._id },
          },
        },
        {
          // The $unwind stage deconstructs an array field from the input documents to output a document for each element.
          // So in our case, the $unwind stage will turn each order into multiple documents, one for each item in the orderItems array.
          $unwind: "$orderItems",
        },
        {
          // Create a products property in the aggregation results array, and set its value to an array of product id values (without duplicates).
          $group: {
            _id: null,
            products: { $addToSet: "$orderItems.product" },
          },
        },
        {
          // Remove the id field from the aggregation results, keep just the products property.
          $project: {
            _id: 0,
            products: 1,
          },
        },
      ]);

      // Create a set with all results from the aggregation pipeline, if none found, return an empty set.
      const ownedProductIdSet = alreadyOwnedProducts.length
        ? new Set(alreadyOwnedProducts[0].products.map((id) => id.toString()))
        : new Set();

      // Create an array of all products in the current order.
      const currentOrderProductIds = order.orderItems.map(
        (item) => item.product
      );

      // From the current order products, get only the products that don't match the already owned products.
      const productsToRemove = currentOrderProductIds.filter(
        (id) => !ownedProductIdSet.has(id.toString())
      );

      // check if the user submitted reviews for the products we're about to remove from the OwnedProduct collection, if they did, throw an appropriate error.
      const currentOrderProductsReviews = await Review.find({
        user: req.user.userId,
        product: { $in: productsToRemove },
      });

      if (currentOrderProductsReviews.length > 0) {
        throw new CustomErrors.BadRequestError(
          `You can't change order status from '${
            order.status
          }' to '${status}' because you've recently submitted reviews for some of the products in the current order. You must delete the reviews first. Here are all related review id's: [${currentOrderProductsReviews.map(
            (review) => review._id
          )}]`
        );
      }

      // Pull the products from the ownedProducts collection when the order status is set as "failed" or "canceled".
      await OwnedProduct.updateOne(
        { user: req.user.userId },
        {
          $pull: {
            products: {
              $in: productsToRemove,
            },
          },
        }
      );
    }

    order.paymentIntentId = paymentIntentId;
    order.status = status;
    await order.save();

    res.status(StatusCodes.OK).json({ order });
  }),
};

export default orderControllers;
