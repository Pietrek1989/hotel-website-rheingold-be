import { checkSchema, validationResult } from "express-validator";
import createHttpError from "http-errors";

const userSchema = {
  name: {
    in: ['body'],
    isString: {
      errorMessage: 'Name is a mandatory field and needs to be a string!',
    },
  },
  surname: {
    in: ['body'],
    isString: {
      errorMessage: 'Surname is a mandatory field and needs to be a string!',
    },
  },
  email: {
    in: ['body'],
    isEmail: {
      errorMessage: 'Email is a mandatory field and needs to be a valid email address!',
    },
  },
  password: {
    in: ['body'],
    isString: {
      errorMessage: 'Password is a mandatory field and needs to be a string!',
    },
    isLength: {
      errorMessage: 'Password should be at least 5 characters long!',
      options: { min: 5 },
    },
  },
  role: {
    in: ['body'],
    optional: { options: { nullable: true } },
    isIn: {
      errorMessage: 'Role must be one of the following values: Admin, User',
      options: [['Admin', 'User']],
    },
  },
};

export const checkUserSchema = checkSchema(userSchema);

export const triggerBadRequest = (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors.array());
  if (errors.isEmpty()) {
    next();
  } else {
    next(
      createHttpError(400, "Errors during user validation", {
        errorsList: errors.array(),
      })
    );
  }
};
