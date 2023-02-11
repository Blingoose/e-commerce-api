import CustomErrorClass from "./custom-error-class.js";
class InventoryError extends CustomErrorClass {
  constructor(message) {
    super(message);
    this.insufficientItems = message;
  }
}

export default InventoryError;
