import mongoose from "mongoose";

const { Schema, model } = mongoose;

const imageSchema = new Schema(
  {
    gallery: [{ type: String }],
    hero: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export default model("Image", imageSchema);
