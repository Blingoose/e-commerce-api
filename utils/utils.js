import rateLimit from "express-rate-limit";
import crypto from "crypto";

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

export const removeTokensFromCookies = (res) => {
  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
};

function createKey(req) {
  const ip = req.headers["x-forwarded-for"] || req.ip;
  const userAgent = req.headers["user-agent"];
  const headers = JSON.stringify(req.headers);
  const str = `${ip}:${userAgent}:${headers}`;
  return crypto.createHash("sha256").update(str).digest("hex");
}

export const rateLimiter = (
  durationInMilliseconds,
  maxConnections,
  errorMessage
) => {
  return rateLimit({
    windowMs: durationInMilliseconds,
    max: maxConnections,
    message: errorMessage,
    keyGenerator: createKey,
  });
};
export const hashString = (string) =>
  crypto.createHash("md5").update(string).digest("hex");
