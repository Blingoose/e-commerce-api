import { StatusCodes } from "http-status-codes";

const errorHandlerMiddleware = (err, req, res, next) => {
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "Something went wrong, try again later.",
  };
  res.status(customError.statusCode).json({ errMsg: customError.msg });
};

export default errorHandlerMiddleware;
