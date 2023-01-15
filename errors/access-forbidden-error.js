import { StatusCodes } from "http-status-codes";
import CustomErrorClass from "./custom-error-class.js";

class AccessForbiddenError extends CustomErrorClass {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.FORBIDDEN;
  }
}

export default AccessForbiddenError;
