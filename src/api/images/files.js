import express from "express";
import createError from "http-errors";
import ImagesModel from "./model.js";
import { jwtAuth } from "../../lib/auth/jwtAuth.js";
import { adminOnlyMiddleware } from "../../lib/auth/admin.js";
import Express from "express";
import multer from "multer";

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import createHttpError from "http-errors";

const filesRouter = Express.Router();

const cloudinaryUploaderGallery = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "hotel-Rheingold/gallery",
    },
  }),
}).single("gallery");

const cloudinaryUploaderOffer = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "hotel-Rheingold/offers",
    },
  }),
}).single("offer");

// const cloudinaryUploaderHero = multer({
//   storage: new CloudinaryStorage({
//     cloudinary,
//     params: {
//       folder: "hotel-Rheingold/hero",
//     },
//   }),
// }).single("hero");

filesRouter.post(
  "/gallery",
  cloudinaryUploaderGallery,
  async (req, res, next) => {
    try {
      const imageUrl = req.file.path;
      const image = new ImagesModel({ gallery: imageUrl });
      await image.save();
      res.status(201).send(image);
    } catch (error) {
      next(error);
    }
  }
);

filesRouter.post(
  "/offer/:offerId",
  cloudinaryUploaderOffer,
  async (req, res, next) => {
    try {
      const offer = await OffersModel.findById(req.params.offerId);
      offer.image = req.file.path;
      await offer.save();
      res.status(201).send(offer);
    } catch (error) {
      next(
        createHttpError(404, `offer with id ${req.params.offerId} not found!`)
      );
    }
  }
);

filesRouter.delete("/gallery", async (req, res, next) => {
  try {
    let { url } = req.body;
    if (Array.isArray(url) && url.length > 0) {
      url = url[0];
    }
    console.log("URL: ", url); // log the url

    const images = await ImagesModel.findOne({});

    if (!images) {
      return res.status(404).send({ message: `Images not found` });
    }

    // Remove the image URL from the gallery array
    images.gallery = images.gallery.filter((imageUrl) => imageUrl !== url);

    const public_id = url
      .split("/hotel-Rheingold/gallery/")
      .pop()
      .split(".")[0];
    console.log("Public ID: ", public_id); // log the public_id

    await cloudinary.uploader.destroy(public_id);

    await images.save();

    res.status(200).send(images.gallery);
  } catch (error) {
    next(error);
  }
});

// filesRouter.post("/hero", cloudinaryUploaderHero, async (req, res, next) => {
//   try {
//     const imageUrl = req.file.path;
//     const image = new ImagesModel({ hero: imageUrl });
//     await image.save();
//     res.status(201).send(image);
//   } catch (error) {
//     next(error);
//   }
// });
export default filesRouter;
