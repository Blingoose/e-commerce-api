import CustomErrorClass from "./custom-error-class.js";

class CreateCustomError extends CustomErrorClass {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export default CreateCustomError;
