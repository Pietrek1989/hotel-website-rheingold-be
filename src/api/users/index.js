import express from "express";
import createError from "http-errors";
import UsersModel from "./model.js";
import ReservationsModel from "../reservations/model.js";
import { createAccessToken } from "../../lib/auth/tools.js";
import passport from "passport";
import { adminOnlyMiddleware } from "../../lib/auth/admin.js";
import { jwtAuth } from "../../lib/auth/jwtAuth.js";

const usersRouter = express.Router();

usersRouter.post("/register", async (req, res, next) => {
  try {
    const { email } = req.body;

    const existingUser = await UsersModel.findOne({ email });
    if (existingUser) {
      return next(createError(400, "Email already in use"));
    }

    const newUser = await UsersModel.create(req.body);
    await newUser.save();

    res.send({ newUser });
  } catch (error) {
    next(error);
  }
});
usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UsersModel.checkCredentials(email, password);

    if (user) {
      const payload = { _id: user._id, role: user.role };
      const accessToken = await createAccessToken(payload);

      res.send({ accessToken });
    } else {
      next(createError(401, "Credentials are not ok!"));
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.get(
  "/googlelogin",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

usersRouter.get(
  "/googlecallback",
  passport.authenticate("google", { session: false }),
  (req, res, next) => {
    try {
      res.redirect(
        `${process.env.FE_URL}/main?accessToken=${req.user.accessToken}&refreshToken=${req.user.refreshToken}`
      );
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.get("/", adminOnlyMiddleware, jwtAuth, async (req, res, next) => {
  try {
    const users = await UsersModel.find();
    res.send(users);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/me/info", jwtAuth, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await UsersModel.findById(userId);

    res.send(user);
  } catch (error) {
    next(error);
  }
});
usersRouter.get("/me/reservations", jwtAuth, async (req, res, next) => {
  try {
    const userID = req.user._id;

    const reservationsByUser = await ReservationsModel.find({
      user: userID,
    }).populate("user");

    res.send(reservationsByUser);
  } catch (error) {
    next(error);
  }
});
usersRouter.get("/me/chats", jwtAuth, async (req, res, next) => {
  try {
    const userID = req.user._id;

    const reservationsByUser = await ReservationsModel.find({
      user: userID,
    }).populate("user");

    res.send(reservationsByUser);
  } catch (error) {
    next(error);
  }
});

usersRouter.get(
  "/:userId",
  adminOnlyMiddleware,
  jwtAuth,
  async (req, res, next) => {
    try {
      const user = await UsersModel.findById(req.params.userId);
      if (user) {
        res.send(user);
      } else {
        next(createError(404, `User with id ${req.params.userId} not found!`));
      }
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.put("/:userId", jwtAuth, async (req, res, next) => {
  try {
    const updatedUser = await UsersModel.findByIdAndUpdate(
      req.params.userId,
      req.body,
      { new: true, runValidators: true }
    );
    if (updatedUser) {
      res.send(updatedUser);
    } else {
      next(createError(404, `User with id ${req.params.userId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.delete(
  "/:userId",
  adminOnlyMiddleware,
  jwtAuth,
  async (req, res, next) => {
    try {
      const deletedUser = await UsersModel.findByIdAndDelete(req.params.userId);
      if (deletedUser) {
        res.status(204).send();
      } else {
        next(createError(404, `User with id ${req.params.userId} not found!`));
      }
    } catch (error) {
      next(error);
    }
  }
);

export default usersRouter;
