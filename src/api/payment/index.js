import express from "express";
import createError from "http-errors";
import { jwtAuth } from "../../lib/auth/jwtAuth.js";
import { adminOnlyMiddleware } from "../../lib/auth/admin.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-08-27",
});

const YOUR_DOMAIN = process.env.FE_URL;

const stripeRouter = express.Router();

stripeRouter.post("/create-checkout-session", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: "price_1N3ekHJKdMpYF5VUS8G3Ekxa",
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${YOUR_DOMAIN}?success=true`,
    cancel_url: `${YOUR_DOMAIN}?canceled=true`,
  });

  res.redirect(303, session.url);
});

export default stripeRouter;
