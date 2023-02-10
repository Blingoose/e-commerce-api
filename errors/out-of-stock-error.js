import CustomErrorClass from "./custom-error-class.js";
export class OutOfStockError extends CustomErrorClass {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.outOfStockItems = message;
  }
}
