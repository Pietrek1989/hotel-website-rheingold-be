import express from "express";
import createError from "http-errors";
import OffersModel from "./model.js";
import { jwtAuth } from "../../lib/auth/jwtAuth.js";
import { adminOnlyMiddleware } from "../../lib/auth/admin.js";

const offersRouter = express.Router();

offersRouter.post("/", jwtAuth, adminOnlyMiddleware, async (req, res, next) => {
  try {
    const newOffer = new OffersModel(req.body);
    const { _id } = await newOffer.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

offersRouter.get("/", async (req, res, next) => {
  try {
    const offers = await OffersModel.find().populate({
      path: "reservations",
      select: "content.checkin content.checkout",
    });
    res.send(offers);
  } catch (error) {
    next(error);
  }
});

offersRouter.get(
  "/:offerId",
  jwtAuth,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const offer = await OffersModel.findById(req.params.offerId).populate({
        path: "reservations",
        select: "content.checkin content.checkout",
      });
      if (offer) {
        res.send(offer);
      } else {
        next(
          createError(404, `Offer with id ${req.params.offerId} not found!`)
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

offersRouter.put(
  "/:offerId",
  jwtAuth,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const updatedOffer = await OffersModel.findByIdAndUpdate(
        req.params.offerId,
        req.body,
        { new: true, runValidators: true }
      );
      if (updatedOffer) {
        res.send(updatedOffer);
      } else {
        next(
          createError(404, `Offer with id ${req.params.offerId} not found!`)
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

offersRouter.delete(
  "/:offerId",
  jwtAuth,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const deletedOffer = await OffersModel.findByIdAndDelete(
        req.params.offerId
      );
      if (deletedOffer) {
        res.status(204).send();
      } else {
        next(
          createError(404, `Offer with id ${req.params.offerId} not found!`)
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

export default offersRouter;
