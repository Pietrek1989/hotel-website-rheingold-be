import express from "express";
import createError from "http-errors";
import { jwtAuth } from "../../lib/auth/jwtAuth.js";
import uniqid from "uniqid";
import Stripe from "stripe";
import ReservationsModel from "../reservations/model.js";
import { adminOnlyMiddleware } from "../../lib/auth/admin.js";

const stripe = new Stripe(
  "sk_test_51N3eaCJKdMpYF5VUK9rnB6fpACgEf0WfQhsKbPfPNh4osrrAYErTPkOFsU3HEeyq7dLLl7Wg84euNLaTZg80sdBc002NC3gY4H"
);
const stripeRouter = express.Router();
stripeRouter.post(
  "/create-checkout-session",
  jwtAuth,
  async (req, res, next) => {
    console.log("body id", req.body._id);
    const { token } = req.body;
    try {
      const customer = await stripe.customers.create({
        email: req.body.token.email,
        source: req.body.token.id,
      });

      const payment = await stripe.charges.create(
        {
          amount: req.body.content.cost * 100,
          customer: customer.id,
          currency: "EUR",
          receipt_email: token.email,
        },
        {
          idempotencyKey: uniqid(),
        }
      );

      if (payment) {
        const updatedReservation = await ReservationsModel.findByIdAndUpdate(
          req.body._id,
          {
            $set: {
              "content.paid": true,
              "content.chargeId": payment.id,
              "content.receiptUrl": payment.receipt_url,
            },
          },
          { new: true, runValidators: true }
        );

        if (!updatedReservation) {
          next(
            createError(404, `Reservation with id: ${req.body._id} not found!`)
          );
        } else {
          res.status(200).send({
            message: "Payment Successful, Your Room is Booked",
            reservation: updatedReservation,
          });
        }
      } else {
        next(createError(400, `Probilem with payment!`));
      }
    } catch (error) {
      console.error(error);
      next(
        createError(
          400,
          `Something wrong with reservation with id:  ${req.body._id} not found!`
        )
      );
    }
  }
);

stripeRouter.post(
  "/refund",
  jwtAuth,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const { _id, chargeId } = req.body;

      // Create a refund for the charge
      const refund = await stripe.refunds.create({
        charge: chargeId,
      });

      if (refund) {
        // Update the reservation status in the database
        const updatedReservation = await ReservationsModel.findByIdAndUpdate(
          _id,
          { $set: { "content.canceled": true } },
          { new: true, runValidators: true }
        );

        if (!updatedReservation) {
          next(createError(404, `Reservation with id: ${_id} not found!`));
        } else {
          res.status(200).send({
            message: "Refund Successful, Reservation Canceled",
            reservation: updatedReservation,
          });
        }
      } else {
        next(createError(400, `Problem with refund!`));
      }
    } catch (error) {
      console.error(error);
      next(createError(400, `Something went wrong with the refund process!`));
    }
  }
);

export default stripeRouter;
