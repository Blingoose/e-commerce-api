export const validatorMinMax = (validationType, validationValue) => {
  return {
    validator: (val) => {
      if (validationType === "minlength") {
        return val.length >= validationValue;
      } else if (validationType === "maxlength") {
        return val.length <= validationValue;
      }
    },
    message: ({ value }) =>
      `${
        validationType === "minlength" ? "Minimum" : "Maximum"
      } length of ${validationValue} characters. You've entered ${
        value.length
      } characters`,
  };
};
