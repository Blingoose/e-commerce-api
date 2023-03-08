import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import asyncWrapper from "../middleware/asyncWrapper.js";
import User from "../models/User.js";
import Token from "../models/Token.js";
import CustomErrors from "../errors/error-index.js";
import { StatusCodes } from "http-status-codes";
import jwtHandler from "../utils/jwt.js";
import { removeTokensFromCookies } from "../utils/utils.js";
import validator from "validator";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

function sendResponse(req, res, message, isVerified, alreadyVerified = false) {
  const acceptHeader = req.headers["accept"]?.toLowerCase();
  const contentType = req.headers["content-type"]?.toLowerCase();

  let fileName;
  let statusCode;

  if (alreadyVerified) {
    fileName = "already-verified.html";
    statusCode = StatusCodes.BAD_REQUEST;
  } else {
    fileName = isVerified ? "verified.html" : "verification-failed.html";
    statusCode = isVerified ? StatusCodes.OK : StatusCodes.UNAUTHORIZED;
  }

  if (contentType && contentType.startsWith("application/json")) {
    if (isVerified && alreadyVerified === false) {
      return res.status(statusCode).json(message);
    }

    const customError = new CustomErrors[
      statusCode === StatusCodes.BAD_REQUEST
        ? "BadRequestError"
        : "UnauthorizedError"
    ](Object.values(message));
    throw customError;
  } else if (acceptHeader && acceptHeader.startsWith("text/html")) {
    const filePath = path.resolve(__dirname, `../public/${fileName}`);
    return res.status(statusCode).sendFile(filePath);
  }
}

const authControllers = {
  register: asyncWrapper(async (req, res, next) => {
    const { name, email, password, username } = req.body;

    //the first created account will be an admin.
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const role = isFirstAccount ? "admin" : "user";

    const verificationToken = crypto.randomBytes(40).toString("hex");
    await User.create({
      name,
      username,
      email,
      password,
      role,
      verificationToken,
    });

    const emailTemplate = fs.readFileSync(
      path.resolve(__dirname, "../email/verification-email-template.html"),
      "utf-8"
    );

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    let emailBody = emailTemplate.replace(
      "{{verificationLink}}",
      `${baseUrl}/api/v1/auth/verify-email?email=${email}&verificationToken=${verificationToken}`
    );
    emailBody = emailBody.replace("{{email}}", email);
    emailBody = emailBody.replace("{{verificationToken}}", verificationToken);

    //create mail via sendgrid.
    const msg = {
      to: `${email}`,
      from: "andy.katov@blingoose.net",
      subject: "E-commerce API account verification",
      html: emailBody,
    };
    await sendEmail(msg);

    res.status(StatusCodes.CREATED).json({
      msg: "Success! Please check your email to verify accout, if you're not seeing the email, please check your spam folder!",
    });
  }),

  verifyEmail: asyncWrapper(async (req, res, next) => {
    const { verificationToken, email } = req.query;

    if (!email) {
      throw new CustomErrors.UnauthorizedError("Must provide an email");
    }

    if (!validator.isEmail(email)) {
      throw new CustomErrors.UnauthorizedError("Must provide a valid email");
    }

    if (!verificationToken) {
      throw new CustomErrors.UnauthorizedError(
        "Must provide a verification token. Check your email"
      );
    }

    const user = await User.findOne({ email });
    const message = { msg: "Verification failed!" };
    if (!user) {
      return sendResponse(req, res, message);
    }

    if (user.isVerified) {
      const isAlreadyVerified = true;
      const message = { msg: "Account has already been verified!" };
      return sendResponse(
        req,
        res,
        message,
        user.isVerified,
        isAlreadyVerified
      );
    } else if (user.verificationToken === verificationToken) {
      user.isVerified = true;
      user.verified = Date.now();
      user.verificationToken = "";
      await user.save();

      const msg = user.isVerified
        ? "You've successfully verified the account!"
        : "Verification Failed!";
      const message = { msg };

      return sendResponse(req, res, message, user.isVerified);
    } else {
      const message = { msg: "Verification failed!" };
      return sendResponse(req, res, message, user.isVerified);
    }
  }),

  login: asyncWrapper(async (req, res, next) => {
    const { email, password } = req.body;

    if (!password) {
      throw new CustomErrors.UnauthorizedError("Must provide password");
    }

    if (!email || !validator.isEmail(email)) {
      throw new CustomErrors.UnauthorizedError("Must Provide a valid email");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new CustomErrors.UnauthorizedError(`User ${email} doesn't exist`);
    }

    if (!user.isVerified) {
      throw new CustomErrors.UnauthorizedError(
        "Account isn't verified. Check your email for verification."
      );
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new CustomErrors.UnauthorizedError("Invalid password");
    }

    const tokenUser = jwtHandler.createTokenUser(user);
    let refreshToken = "";

    const existingToken = await Token.findOne({ user: user._id });
    if (existingToken) {
      const { isValid, status } = existingToken;
      if (!isValid && status !== "logged-out") {
        throw new CustomErrors.UnauthorizedError("Invalid credentials");
      }

      existingToken.status = "active";
      existingToken.isValid = true;
      await existingToken.save();

      jwtHandler.attachCookiesToResponse({
        res,
        user: tokenUser,
        refreshToken: existingToken.refreshToken,
      });

      return res.status(StatusCodes.OK).json({ user: tokenUser });
    }

    //if no existingToken create a refresh token
    refreshToken = crypto.randomBytes(40).toString("hex");
    const userAgent = req.headers["user-agent"];
    const ip = req.ip;
    const userToken = { refreshToken, ip, userAgent, user: user._id };

    await Token.create(userToken);

    jwtHandler.attachCookiesToResponse({
      res,
      user: tokenUser,
      refreshToken,
    });

    res.status(StatusCodes.OK).json({ user: tokenUser });
  }),

  logout: asyncWrapper(async (req, res, next) => {
    await Token.findOneAndUpdate(
      { user: req.user.userId },
      { status: "logged-out", isValid: false }
    );
    removeTokensFromCookies(res);

    res.status(StatusCodes.OK).send({ msg: "Logged-out" });
  }),

  forgotPassword: asyncWrapper(async (req, res, next) => {
    const { email } = req.body;
    if (!email || !validator.isEmail(email)) {
      throw new CustomErrors.BadRequestError("Must provide a valid email");
    }

    const user = await User.findOne({ email });

    if (user) {
      const passwordToken = crypto.randomBytes(70).toString("hex");

      //send email
      const fiveMinutes = 1000 * 60 * 5;
      const passwordTokenExpirationDate = new Date(Date.now() + fiveMinutes);

      user.passwordToken = passwordToken;
      user.passwordTokenExpirationDate = passwordTokenExpirationDate;
      await user.save();

      const emailTemplate = fs.readFileSync(
        path.resolve(__dirname, "../email/reset-password-email-template.html"),
        "utf-8"
      );

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      let emailBody = emailTemplate.replace(
        "{{resetPasswordLink}}",
        `${baseUrl}/api/v1/auth/reset-page?token=${passwordToken}&email=${email}`
      );
      emailBody = emailBody.replace("{{email}}", email);
      emailBody = emailBody.replace("{{token}}", passwordToken);

      const msg = {
        to: `${email}`,
        from: "andy.katov@blingoose.net",
        subject: "E-commerce API Reset Password",
        html: emailBody,
      };
      await sendEmail(msg);
    }

    res
      .status(StatusCodes.OK)
      .json({ msg: "Please check your email for reset password link" });
  }),

  resetPasswordPage: (req, res) => {
    const emailTemplate = path.resolve(
      __dirname,
      "../public/reset-password.html"
    );

    res.sendFile(emailTemplate);
  },

  resetPassword: asyncWrapper(async (req, res, next) => {
    const { email, password, token } = req.body;
    if (!token || !email || !password) {
      throw new CustomErrors.BadRequestError("Please provide all values");
    }

    if (!validator.isEmail(email)) {
      throw new CustomErrors.BadRequestError("Must provide a valid email");
    }

    // Validate the password
    if (!password || password.length < 6) {
      throw new CustomErrors.BadRequestError(
        "Password must be at least 6 characters long"
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new CustomErrors.BadRequestError("Invalid token");
    }

    if (user?.passwordToken === "") {
      throw new CustomErrors.BadRequestError(
        "You've already submitted a new password. Use 'forgot password' to repeat the process."
      );
    }

    // Update the user's password in the database

    const currentDate = new Date();
    if (
      user.passwordToken === token &&
      user.passwordTokenExpirationDate > currentDate
    ) {
      user.password = password;
      user.passwordToken = "";
      user.passwordTokenExpirationDate = "";
      await user.save();

      return res
        .status(StatusCodes.OK)
        .json({ msg: "Password updated successfully" });
    } else if (
      !user.passwordToken &&
      user.passwordTokenExpirationDate < currentDate
    ) {
      throw new CustomErrors.BadRequestError(
        "This link is no longer valid. Repeat the process again"
      );
    } else {
      throw new CustomErrors.BadRequestError("Invalid token");
    }
  }),
};

export default authControllers;
