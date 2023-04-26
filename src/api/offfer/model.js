import mongoose from "mongoose";

const { Schema, model } = mongoose;

const offerSchema = new Schema(
  {
    name: { type: String, required: true },
    priceSeason: { type: Number, required: true },
    priceOffSeason: { type: Number, required: true },
    image: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default model("Offer", offerSchema);
