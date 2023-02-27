import asyncWrapper from "../middleware/asyncWrapper.js";
import User from "../models/User.js";
import CustomErrors from "../errors/error-index.js";
import { StatusCodes } from "http-status-codes";
import jwtHandler from "../utils/jwt.js";
import validator from "validator";
import crypto from "crypto";
import sgMail from "@sendgrid/mail";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
      path.resolve(__dirname, "../email/email-template.html"),
      "utf-8"
    );

    let emailBody = emailTemplate.replace(
      "{{verificationLink}}",
      `https://e-commerce-api-jxc4.onrender.com/api/v1/auth/verify-email?email=${email}&verificationToken=${verificationToken}`
    );

    emailBody = emailBody.replace("{{email}}", email);
    emailBody = emailBody.replace("{{verificationToken}}", verificationToken);

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: `${email}`,
      from: "andy.katov@blingoose.net",
      subject: "E-commerce API account verification",
      html: emailBody,
    };

    await sgMail.send(msg);

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
    jwtHandler.attachCookiesToResponse({ res, user: tokenUser });
    res.status(StatusCodes.OK).json({ user: tokenUser });
  }),

  logout: (req, res) => {
    res.cookie("token", "logout", {
      httpOnly: true,
      expires: new Date(Date.now()),
    });
    res.status(StatusCodes.OK).send({ msg: "Logged-out" });
  },
};

export default authControllers;
