import { StatusCodes } from "http-status-codes";
import CustomErrorClass from "./custom-error-class.js";

class NotFoundError extends CustomErrorClass {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

export default NotFoundError;
