import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { hashString } from "./utils.js";
import validator from "validator";
import User from "../models/User.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import { StatusCodes } from "http-status-codes";
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const errorPageTemplate = fs.readFileSync(
  path.resolve(__dirname, "../public/error-page.html"),
  "utf-8"
);

const resetPasswordHelper = {
  requireResetToken: asyncWrapper(async (req, res, next) => {
    const { email, token } = req.query;

    if (!email || !token) {
      // Redirect to error page if email or token not provided
      const missingQueryParmeters = errorPageTemplate.replace(
        "{{errorCause}}",
        "missing url query parameters `token` or `email`"
      );
      return res.status(StatusCodes.BAD_REQUEST).send(missingQueryParmeters);
    }

    if (!validator.isEmail(email)) {
      // Redirect to error page if invalid email provided
      const invalidEmailAddress = errorPageTemplate.replace(
        "{{errorCause}}",
        "invalid email address"
      );
      return res.status(StatusCodes.BAD_REQUEST).send(invalidEmailAddress);
    }

    const user = await User.findOne({
      email,
      passwordToken: hashString(token),
    });

    if (
      !user ||
      !user.passwordTokenExpirationDate ||
      user.passwordTokenExpirationDate < new Date()
    ) {
      // Redirect to error page if invalid user or expired token
      const invalidToken = errorPageTemplate.replace(
        "{{errorCause}}",
        "token is no longer valid bacause the session has expired"
      );
      return res.status(StatusCodes.BAD_REQUEST).send(invalidToken);
    }

    // Set a flag on the response object to indicate valid reset token found
    res.locals.validResetToken = true;
    next();
  }),

  resetPasswordPage: asyncWrapper(async (req, res, next) => {
    if (!res.locals.validResetToken) {
      // a safeguard check
      const invalidToken = errorPageTemplate.replace(
        "{{errorCause}}",
        "token is no longer valid bacause the session has expired"
      );
      return res.status(StatusCodes.BAD_REQUEST).send(invalidToken);
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
      // req.session.destroy();
      res.cookie("connect.sid", "session-over", {
        httpOnly: true,
        expires: new Date(Date.now()),
      });
      return res.sendFile(successPage);
    }
    const invalidToken = errorPageTemplate.replace(
      "{{errorCause}}",
      "access denied due to wrong permission"
    );
    return res.status(StatusCodes.BAD_REQUEST).send(invalidToken);
  },
};

export default resetPasswordHelper;
