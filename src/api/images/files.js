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
  
  const cloudinaryUploaderHero = multer({
    storage: new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "hotel-Rheingold/hero",
      },
    }),
  }).single("hero");
  


  filesRouter.post("/gallery", cloudinaryUploaderGallery, async (req, res, next) => {
    try {
      const imageUrl = req.file.path;
      const image = new ImagesModel({ gallery: imageUrl });
      await image.save();
      res.status(201).send(image);
    } catch (error) {
      next(error);
    }
  });
  
  filesRouter.post("/hero", cloudinaryUploaderHero, async (req, res, next) => {
    try {
      const imageUrl = req.file.path;
      const image = new ImagesModel({ hero: imageUrl });
      await image.save();
      res.status(201).send(image);
    } catch (error) {
      next(error);
    }
  });

  filesRouter.post("/offer/:offerId", cloudinaryUploaderOffer, async (req, res, next) => {
    try {
      const offer = await OffersModel.findById(req.params.offerId);
      offer.image = req.file.path;
      await offer.save();
      res.status(201).send(offer);
    } catch (error) {
        next(
            createHttpError(
              404,
              `offer with id ${req.params.offerId} not found!`
            )
          );
        }
    });