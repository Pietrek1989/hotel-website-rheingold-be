import { checkSchema, validationResult } from "express-validator";
import createHttpError from "http-errors";

const reservationSchema = {
  'content.cost': {
    in: ['body'],
    isNumeric: {
      errorMessage: 'Cost is a mandatory field and needs to be a number!',
    },
  },
  'content.checkin': {
    in: ['body'],
    isISO8601: {
      errorMessage: 'Check-in is a mandatory field and needs to be a valid date!',
    },
  },
  'content.checkout': {
    in: ['body'],
    isISO8601: {
      errorMessage: 'Checkout is a mandatory field and needs to be a valid date!',
    },
  },
  'content.offer': {
    in: ['body'],
    isString: {
      errorMessage: 'Offer is a mandatory field and needs to be a string!',
    },
  },
};

export const checkReservationSchema = checkSchema(reservationSchema);

export const triggerBadRequest = (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors.array());
  if (errors.isEmpty()) {
    next();
  } else {
    next(
      createHttpError(400, "Errors during reservation validation", {
        errorsList: errors.array(),
      })
    );
  }
};
