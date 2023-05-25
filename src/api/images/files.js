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
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
      let images = await ImagesModel.findOne({});

      if (!images) {
        images = new ImagesModel({ gallery: [imageUrl] });
      } else {
        images.gallery.push(imageUrl);
      }

      await images.save();
      res.status(201).send(images);
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

    const public_id = `hotel-Rheingold/gallery/${
      url.split("/hotel-Rheingold/gallery/").pop().split(".")[0]
    }`;
    console.log("Public ID: ", public_id); // log the public_id

    let destroyResult = await cloudinary.uploader.destroy(public_id);
    console.log(destroyResult); // Log the result of the destroy method

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
