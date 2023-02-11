import BadRequestError from "./bad-request-error.js";
import NotFoundError from "./not-found-error.js";
import UnauthorizedError from "./unauthorized-error.js";
import AccessForbiddenError from "./access-forbidden-error.js";
import CreateCustomError from "./create-custom-error.js";
import InventoryError from "./inventory-error.js";

const CustomErrors = {
  AccessForbiddenError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  CreateCustomError,
  InventoryError,
};

export default CustomErrors;
