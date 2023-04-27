import express from "express";
import createError from "http-errors";
import ReservationsModel from "./model.js";
import { jwtAuth } from "../../lib/auth/jwtAuth.js";
import { adminOnlyMiddleware } from "../../lib/auth/admin.js";
import UsersModel from "../users/model.js";

const reservationsRouter = express.Router();

reservationsRouter.post("/", jwtAuth, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const newReservation = new ReservationsModel({
      ...req.body,
      user: userId,
    });
    const { _id } = await newReservation.save();
    await UsersModel.findOneAndUpdate(
      { _id: userId },
      { $push: { reservations: _id } },
      { new: true, runValidators: true }
    );
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

reservationsRouter.get(
  "/",
  jwtAuth,
  adminOnlyMiddleware,
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
  jwtAuth,
  adminOnlyMiddleware,
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
  jwtAuth,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const updatedReservation = await ReservationsModel.findByIdAndUpdate(
        req.params.reservationId,
        { ...req.body },
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
