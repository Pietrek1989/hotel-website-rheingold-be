import express from "express";
import createError from "http-errors";
import ReservationsModel from "./model.js";
import { jwtAuth } from "../../lib/auth/jwtAuth.js";
import { adminOnlyMiddleware } from "../../lib/auth/admin.js";

const reservationsRouter = express.Router();

reservationsRouter.post("/", jwtAuth, async (req, res, next) => {
  try {
    const newReservation = new ReservationsModel(req.body);
    const { _id } = await newReservation.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

reservationsRouter.get(
  "/",
  adminOnlyMiddleware,
  jwtAuth,
  async (req, res, next) => {
    try {
      const reservations = await ReservationsModel.find();
      res.send(reservations);
    } catch (error) {
      next(error);
    }
  }
);

reservationsRouter.get(
  "/:reservationId",
  adminOnlyMiddleware,
  jwtAuth,
  async (req, res, next) => {
    try {
      const reservation = await ReservationsModel.findById(
        req.params.reservationId
      );
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
  }
);

reservationsRouter.put(
  "/:reservationId",
  adminOnlyMiddleware,
  jwtAuth,
  async (req, res, next) => {
    try {
      const updatedReservation = await ReservationsModel.findByIdAndUpdate(
        req.params.reservationId,
        req.body,
        { new: true, runValidators: true }
      );
      if (updatedReservation) {
        res.send(updatedReservation);
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

reservationsRouter.delete(
  "/:reservationId",
  adminOnlyMiddleware,
  jwtAuth,
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
