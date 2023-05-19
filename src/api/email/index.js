import express from "express";
import SibApiV3Sdk from "sib-api-v3-sdk";
import createHttpError from "http-errors";

const emailRouter = express.Router();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

emailRouter.post("/send-contact", async (req, res, next) => {
  const { email, name, message, isTicket } = req.body;

  const sendSmtpEmail = {
    to: [{ email: process.env.SENDER_EMAIL_ADRESS }],
    sender: { email, name },
    subject: "New message from Contact Form",
    htmlContent: `<h1>New Message</h1><p>From: ${name} (${email})</p><p>${message}</p>`,
    replyTo: { email },
  };

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    if (isTicket) {
      const sendSmtpEmailCopy = {
        to: [{ email }],
        sender: {
          email: { email: process.env.SENDER_EMAIL_ADRESS },
          name: "Haus Rheingold",
        },
        subject: "Copy of your message to Contact Form",
        htmlContent: `<h1>This is a copy of your message</h1><p>${message}</p>`,
        replyTo: { email: { email: process.env.SENDER_EMAIL_ADRESS } },
      };
      await apiInstance.sendTransacEmail(sendSmtpEmailCopy);
    }
    res.status(200).send("Email sent successfully");
  } catch (error) {
    console.error(error);
    next(new createError.InternalServerError("Error sending email"));
  }
});

export default emailRouter;
