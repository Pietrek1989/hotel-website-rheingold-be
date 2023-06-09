import express from "express";
import createError from "http-errors";
import ReservationsModel from "./model.js";
import { jwtAuth } from "../../lib/auth/jwtAuth.js";
import { adminOnlyMiddleware } from "../../lib/auth/admin.js";
import UsersModel from "../users/model.js";
import OffersModel from "../offfer/model.js";
import { format, utcToZonedTime } from "date-fns-tz";
import { checkReservationSchema, triggerBadRequest } from "./validation.js";

const reservationsRouter = express.Router();

reservationsRouter.post(
  "/",
  jwtAuth,
  checkReservationSchema,
  triggerBadRequest,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const hotelTimeZone = "Europe/Berlin";
      console.log(req.body);

      const {
        checkin: rawCheckin,
        checkout: rawCheckout,
        cost,
        offer,
      } = req.body.content;

      const checkin = format(
        utcToZonedTime(rawCheckin, hotelTimeZone),
        "yyyy-MM-dd",
        { timeZone: hotelTimeZone }
      );
      const checkout = format(
        utcToZonedTime(rawCheckout, hotelTimeZone),
        "yyyy-MM-dd",
        { timeZone: hotelTimeZone }
      );

      // Find the offer by ID and populate the reservations
      const offerData = await OffersModel.findById(offer).populate(
        "reservations"
      );

      // Check for overlapping reservations
      for (const reservation of offerData.reservations) {
        if (
          (checkin >= reservation.content.checkin &&
            checkin <= reservation.content.checkout) ||
          (checkout >= reservation.content.checkin &&
            checkout <= reservation.content.checkout) ||
          (checkin <= reservation.content.checkin &&
            checkout >= reservation.content.checkout)
        ) {
          return res.status(409).send("The requested dates are not available.");
        }
      }

      // Proceed with creating the new reservation if there are no conflicts
      const newReservation = new ReservationsModel({
        content: {
          checkin,
          checkout,
          cost,
          offer,
        },
        user: userId,
      });
      const { _id, content } = await newReservation.save();

      await UsersModel.findOneAndUpdate(
        { _id: userId },
        { $push: { reservations: _id } },
        { new: true, runValidators: true }
      );
      const updatedOffer = await OffersModel.findOneAndUpdate(
        { _id: content.offer },
        { $push: { reservations: _id } },
        { new: true, runValidators: true }
      );
      console.log("Updated offer:", updatedOffer);

      res.status(201).send(newReservation);
    } catch (error) {
      next(error);
    }
  }
);

reservationsRouter.get("/", async (req, res, next) => {
  try {
    const reservations = await ReservationsModel.find()
      .populate({
        path: "user",
        select: "name surname -_id",
      })
      .populate({
        path: "content.offer",
        select: "name -_id",
      })
      .sort({
        "content.checkin": -1,
      });
    res.send(reservations);
  } catch (error) {
    next(error);
  }
});

reservationsRouter.get("/earningsNow", async (req, res, next) => {
  try {
    const hotelTimeZone = "Europe/Berlin";

    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const zonedStart = format(
      utcToZonedTime(start, hotelTimeZone),
      "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
      { timeZone: hotelTimeZone }
    );

    const end = new Date();
    const zonedEnd = format(
      utcToZonedTime(end, hotelTimeZone),
      "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
      { timeZone: hotelTimeZone }
    );

    const reservations = await ReservationsModel.find({
      $or: [
        {
          "content.checkin": {
            $gte: zonedStart,
            $lt: zonedEnd,
          },
        },
        {
          "content.checkout": {
            $gte: zonedStart,
            $lt: zonedEnd,
          },
        },
        {
          "content.checkin": {
            $lt: zonedStart,
          },
          "content.checkout": {
            $gt: zonedEnd,
          },
        },
      ],
      "content.paid": true,
    });

    const earnings = reservations.reduce((total, reservation) => {
      if (!reservation.content.canceled) {
        console.log(`Cost of reservation: ${reservation.content.cost}`);

        return total + Number(reservation.content.cost);
      }
      return total;
    }, 0);

    res.status(200).send({ earnings: earnings });
  } catch (error) {
    next(error);
  }
});
reservationsRouter.get("/totalEarnings", async (req, res, next) => {
  try {
    const total = await ReservationsModel.aggregate([
      {
        $match: {
          "content.paid": true,
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$content.cost" },
        },
      },
    ]);
    console.log(`Total: ${JSON.stringify(total, null, 2)}`);

    res.status(200).send({ totalEarnings: total[0].totalEarnings });
  } catch (err) {
    next(err);
  }
});

reservationsRouter.get("/countThisMonth", async (req, res, next) => {
  try {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date();

    const count = await ReservationsModel.countDocuments({
      "content.checkin": {
        $gte: start,
        $lt: end,
      },
    });

    res.status(200).send({ count: count });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

reservationsRouter.get("/countAll", async (req, res, next) => {
  try {
    const count = await ReservationsModel.countDocuments({});
    res.json(count);
  } catch (err) {
    next(err);
  }
});

reservationsRouter.get("/:reservationId", async (req, res, next) => {
  try {
    const reservation = await ReservationsModel.findById(
      req.params.reservationId
    ).populate("user");
    if (reservation) {
      res.send(reservation);
    } else {
      next(
        createError(
          404,
          `Reservation with id ${req.params.reservationId} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

reservationsRouter.put(
  "/:reservationId",
  jwtAuth,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const reservationId = req.params.reservationId;
      const updates = req.body;

      const reservation = await ReservationsModel.findById(reservationId);

      if (!reservation) {
        return next(createError(404, "Reservation not found"));
      }

      for (let key in updates) {
        if (key === "content") {
          for (let subKey in updates.content) {
            if (reservation.content[subKey] !== undefined) {
              // only allow updating existing fields in content
              reservation.content[subKey] = updates.content[subKey];
            }
          }
        } else if (reservation[key] !== undefined) {
          // only allow updating existing top-level fields
          reservation[key] = updates[key];
        }
      }

      await reservation.save();

      res.send({
        message: "Reservation data updated successfully",
        updatedUser: reservation,
      });
    } catch (error) {
      next(error);
    }
  }
);

reservationsRouter.delete(
  "/:reservationId",

  jwtAuth,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const deletedReservation = await ReservationsModel.findByIdAndDelete(
        req.params.reservationId
      );
      if (deletedReservation) {
        res.status(204).send();
      } else {
        next(
          createError(
            404,
            `Reservation with id ${req.params.reservationId} not found!`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

export default reservationsRouter;
