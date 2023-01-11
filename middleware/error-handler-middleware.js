import { StatusCodes } from "http-status-codes";

const errorHandlerMiddleware = (err, req, res, next) => {
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "Something went wrong, try again later.",
  };

  if (err.code === 11000) {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.msg = "Email already exist!";
  }
  res.status(customError.statusCode).json({ errMsg: customError.msg });
  // res.status(customError.statusCode).json({ err });
};

export default errorHandlerMiddleware;
