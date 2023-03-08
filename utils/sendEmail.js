import sgMail from "@sendgrid/mail";

const sendEmail = async (msg) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  await sgMail.send(msg);
};

export default sendEmail;
