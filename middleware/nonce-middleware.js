import crypto from "crypto";

const addNonce = (req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
};

export default addNonce;
