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

  if (err.name === "ValidationError") {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.msg = Object.keys(err.errors).map(
      (error) => `${error}: ` + err.errors[error].message
    );
  }

  res.status(customError.statusCode).json({ errMsg: customError.msg });
};

export default errorHandlerMiddleware;
