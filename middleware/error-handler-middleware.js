import { StatusCodes } from "http-status-codes";
import CustomErrors from "../errors/error-index.js";

const getInventoryErrorResponse = ({ notEnoughInventory, outOfStock }) => {
  const message = {
    name: "Inventory Error",
  };

  if (notEnoughInventory.length > 0) {
    const prop = "Not Enough Inventory";
    message[prop] = notEnoughInventory;
  }

  if (outOfStock.length > 0) {
    const prop = "Out Of Stock";
    message[prop] = outOfStock;
  }

  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message,
  };
};

const errorHandlerMiddleware = (err, req, res, next) => {
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "Something went wrong, try again later.",
  };

  //Duplicate error
  if (err.code === 11000) {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.msg = `${Object.keys(err.keyValue)} already exist!`;
  }

  if (err.name === "ValidationError") {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.msg = Object.keys(err.errors).reduce((acc, field) => {
      acc[field] = err.errors[field].message;
      return acc;
    }, {});
  }

  if (err.name === "CastError") {
    customError.statusCode = StatusCodes.NOT_FOUND;
    customError.msg = `No item found with id: ${err.value}`;
  }

  if (err instanceof CustomErrors.InventoryError) {
    const stockError = err.insufficientItems;
    const { statusCode, message } = getInventoryErrorResponse(stockError);
    customError.statusCode = statusCode;
    customError.msg = message;
  }

  res.status(customError.statusCode).json({ errMsg: customError.msg });
};

export default errorHandlerMiddleware;
