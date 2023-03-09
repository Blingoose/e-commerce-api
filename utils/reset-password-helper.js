import path from "path";
import { fileURLToPath } from "url";
import CustomErrors from "../errors/error-index.js";
import validator from "validator";
import User from "../models/User.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const resetPasswordHandler = {
  requireResetToken: asyncWrapper(async (req, res, next) => {
    const { email, token } = req.query;

    if (!email || !token) {
      // Redirect to error page if email or token not provided
      throw new CustomErrors.BadRequestError("Wrong url");
    }

    if (!validator.isEmail(email)) {
      // Redirect to error page if invalid email provided
      throw new CustomErrors.BadRequestError("Email is not valid");
    }

    const user = await User.findOne({ email, passwordToken: token });

    if (
      !user ||
      !user.passwordTokenExpirationDate ||
      user.passwordTokenExpirationDate < new Date()
    ) {
      // Redirect to error page if invalid user or expired token
      throw new CustomErrors.BadRequestError("This link is no longer valid");
    }

    // Set a flag on the response object to indicate valid reset token found
    res.locals.validResetToken = true;
    next();
  }),

  resetPasswordPage: asyncWrapper(async (req, res, next) => {
    if (!res.locals.validResetToken) {
      // a safeguard check
      throw new CustomErrors.BadRequestError("This link is no longer valid");
    }

    const emailTemplate = path.resolve(
      __dirname,
      "../public/views/reset-password.ejs"
    );

    res.render(emailTemplate, { nonce: res.locals.nonce });
  }),
};

export default resetPasswordHandler;
