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

const authControllers = {
  register: asyncWrapper(async (req, res, next) => {
    const { name, email, password, username } = req.body;

    //the first created account will be an admin.
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const role = isFirstAccount ? "admin" : "user";

    const verificationToken = crypto.randomBytes(40).toString("hex");
    const user = await User.create({
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

    console.log(verificationToken, email);

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

    if (!user) {
      throw new CustomErrors.UnauthorizedError("Verification failed");
    }

    if (!user.isVerified && user.verificationToken !== verificationToken) {
      throw new CustomErrors.UnauthorizedError("Verification failed");
    } else if (user.isVerified === true) {
      throw new CustomErrors.BadRequestError("Account is already verified");
    }

    user.isVerified = true;
    user.verified = Date.now();
    user.verificationToken = "";

    await user.save();

    res.status(StatusCodes.OK).json({
      msg: "You've successfully verified the account",
    });
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
