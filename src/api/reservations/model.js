import mongoose from "mongoose";

const { Schema, model } = mongoose;

const reservationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", require: true },
    content: {
      cost: { type: Number, require: true },
      checkin: { type: Date, require: true },
      checkout: { type: Date, require: true },
      paid: { type: Boolean, default: false },
      chargeId: { type: String },
      canceled: { type: Boolean, default: false },
      offer: { type: Schema.Types.ObjectId, ref: "Offer", require: true },
    },
  },
  {
    timestamps: true,
  }
);

export default model("Reservation", reservationSchema);
