import CustomErrorClass from "./custom-error-class.js";
import BadRequestError from "./bad-request-error.js";
import NotFoundError from "./not-found-error.js";
import UnauthorizedError from "./unauthorized-error.js";

const customErrors = {
  CustomErrorClass,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
};

export default customErrors;
