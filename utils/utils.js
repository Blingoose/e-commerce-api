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

// Virtual fields are fields that are not stored in the database, but are generated on the fly when queried.
// They allow you to add additional fields to your documents that are calculated based on other fields,
// or to return a different representation of an existing field.
export const createVirtualField = (schema, fieldName, ...options) => {
  return schema.virtual(fieldName, ...options);
};

export const excludeFields = (
  role = "user",
  currentUsername = null,
  username = null
) => {
  let exclude = "-password -email -__v";
  if (role === "admin" || (currentUsername && currentUsername === username)) {
    exclude = "-password -__v";
  }
  return exclude;
};
