import { StatusCodes } from "http-status-codes";
import CustomErrorClass from "./custom-error-class.js";

class BadRequestError extends CustomErrorClass {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

export default BadRequestError;
