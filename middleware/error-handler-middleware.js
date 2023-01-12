import { StatusCodes } from "http-status-codes";
import {
  replaceLastCommaWithAnd,
  checkIfArrayHasMoreThanOne,
  checkIfWordStartsWithVowel,
} from "../utils/utils.js";

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
    const fieldArr = Object.keys(err.errors);
    if (checkIfArrayHasMoreThanOne(fieldArr)) {
      const convertFieldToPlural = replaceLastCommaWithAnd(fieldArr);
      customError.msg = `Validation failed. Please provide ${convertFieldToPlural} fields`;
    } else {
      // if only one field is missing
      customError.msg = `Validation failed. Please provide ${
        checkIfWordStartsWithVowel(fieldArr) ? "an" : "a"
      } ${fieldArr} field`;
    }
  }
  res.status(customError.statusCode).json({ errMsg: customError.msg });
  // res.status(customError.statusCode).json({ err });
};

export default errorHandlerMiddleware;
