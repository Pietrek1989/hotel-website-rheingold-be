import OffersModel from "./api/offfer/model.js";
import ReservationsModel from "./api/reservations/model.js";

const removeExpiredReservations = async () => {
  const currentDate = new Date();

  // Find expired reservations
  const expiredReservations = await ReservationsModel.find({
    "content.checkout": { $lt: currentDate },
  });

  // Remove expired reservations from the offers
  expiredReservations.forEach(async (reservation) => {
    await OffersModel.updateMany(
      { reservations: reservation._id },
      { $pull: { reservations: reservation._id } }
    );
  });

  // Delete expired reservations
  await ReservationsModel.deleteMany({
    "content.checkout": { $lt: currentDate },
  });
};

export default removeExpiredReservations;
