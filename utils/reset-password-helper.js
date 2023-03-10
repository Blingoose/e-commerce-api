import path from "path";
import { fileURLToPath } from "url";
import CustomErrors from "../errors/error-index.js";
import validator from "validator";
import User from "../models/User.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const resetPasswordHelper = {
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

    const resetPage = path.resolve(
      __dirname,
      "../public/views/reset-password.ejs"
    );

    res.render(resetPage, { nonce: res.locals.nonce });
  }),

  resetSuccessPage: (req, res, next) => {
    if (req.session.resetSuccess) {
      const successPage = path.resolve(
        __dirname,
        "../public/success-page.html"
      );
      req.session.destroy();
      res.cookie("connect.sid", "session-over", {
        httpOnly: true,
        expires: new Date(Date.now()),
      });
      return res.sendFile(successPage);
    }
    throw new CustomErrors.BadRequestError("Session is over!");
  },
};

export default resetPasswordHelper;
