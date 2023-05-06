import express from "express";
import createError from "http-errors";
import ImagesModel from "./model.js";
import { jwtAuth } from "../../lib/auth/jwtAuth.js";
import { adminOnlyMiddleware } from "../../lib/auth/admin.js";

const imagesRouter = express.Router();

imagesRouter.post("/", jwtAuth, adminOnlyMiddleware, async (req, res, next) => {
  try {
    const newImage = new ImagesModel(req.body);
    const { _id } = await newImage.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

imagesRouter.get("/", async (req, res, next) => {
  try {
    const images = await ImagesModel.find()
    res.send(images);
  } catch (error) {
    next(error);
  }
});

imagesRouter.get(
  "/:imageId",
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const image = await ImagesModel.findById(req.params.imageId).populate({
        path: "reservations",
        select: "content.checkin content.checkout",
      });
      if (image) {
        res.send(image);
      } else {
        next(
          createError(404, `Image with id ${req.params.imageId} not found!`)
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

imagesRouter.put(
  "/:imageId",
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const updatedImage = await ImagesModel.findByIdAndUpdate(
        req.params.imageId,
        req.body,
        { new: true, runValidators: true }
      );
      if (updatedImage) {
        res.send(updatedImage);
      } else {
        next(
          createError(404, `Image with id ${req.params.imageId} not found!`)
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

imagesRouter.delete(
  "/:imageId",
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const deletedImage = await ImagesModel.findByIdAndDelete(
        req.params.imageId
      );
      if (deletedImage) {
        res.status(204).send();
      } else {
        next(
          createError(404, `Image with id ${req.params.imageId} not found!`)
        );
      }
    } catch (error) {
      next(error);
    }
  }
);



export default imagesRouter;
