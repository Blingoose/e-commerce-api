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

export const ratingMinMax = (validationType, validationValue) => {
  return {
    validator: (val) => {
      if (validationType === "min") {
        return val >= validationValue;
      } else if (validationType === "max") {
        return val <= validationValue;
      }
    },
    message: ({ value }) =>
      `${
        validationType === "min" ? "Lowest" : "Highest"
      } rating is ${validationValue}. You've entered ${value}`,
  };
};
