import { StatusCodes } from "http-status-codes";
import { OutOfStockError } from "../errors/out-of-stock-error.js";

const errorHandlerMiddleware = (err, req, res, next) => {
  if (err instanceof OutOfStockError) {
    return res.status(StatusCodes.BAD_REQUEST).send({
      error: err,
    });
  }

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

  res.status(customError.statusCode).json({ errMsg: customError.msg });
  // res.status(customError.statusCode).json({ err });
};

export default errorHandlerMiddleware;
