import mongoose from "mongoose";

const { Schema, model } = mongoose;

const reservationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    content: {
      room: { type: String },
      paid: { type: Boolean, default: false },
      canceled: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

export default model("Reservation", reservationSchema);
