import { StatusCodes } from "http-status-codes";
import CustomErrorClass from "./custom-error-class.js";

class UnauthorizedError extends CustomErrorClass {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

export default UnauthorizedError;
