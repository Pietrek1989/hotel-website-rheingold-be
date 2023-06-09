import express from "express";
import createError from "http-errors";
import UsersModel from "./model.js";
import ReservationsModel from "../reservations/model.js";
import {
  createAccessToken,
  createTokens,
  verifyAndRefreshTokens,
} from "../../lib/auth/jwtTokens.js";
import passport from "passport";
import { adminOnlyMiddleware } from "../../lib/auth/admin.js";
import { jwtAuth } from "../../lib/auth/jwtAuth.js";
import { checkUserSchema, triggerBadRequest } from "./validation.js";

const usersRouter = express.Router();

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
        `${process.env.FE_URL}/?accessToken=${req.user.accessToken}&refreshToken=${req.user.refreshToken}`
      );
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.get("/", async (req, res, next) => {
  try {
    const users = await UsersModel.find();
    res.send(users);
  } catch (error) {
    next(error);
  }
});
usersRouter.get("/count", async (req, res) => {
  try {
    const count = await UsersModel.countDocuments({});
    res.json(count);
  } catch (err) {
    res.status(500).json({ message: err.message });
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

usersRouter.put("/me/info", jwtAuth, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    const user = await UsersModel.findById(userId);

    if (!user) {
      return next(createError(404, "User not found"));
    }

    for (let key in updates) {
      if (user[key] !== undefined) {
        // only allow updating existing fields
        user[key] = updates[key];
      }
    }

    await user.save();

    res.send({ message: "User data updated successfully" });
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/me/reservations", jwtAuth, async (req, res, next) => {
  try {
    const userID = req.user._id;

    const reservationsByUser = await ReservationsModel.find({
      user: userID,
    })
      .populate("content.offer")
      .populate("user");

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
usersRouter.post(
  "/account",
  checkUserSchema,
  triggerBadRequest,
  async (req, res, next) => {
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
  }
);
usersRouter.post("/session", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UsersModel.checkCredentials(email, password);
    if (user) {
      const { accessToken, refreshToken } = await createTokens(user);
      res.send({ accessToken, refreshToken });
    } else {
      next(createHttpError(401, "Invalid credentials"));
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.delete("/session", jwtAuth, async (req, res, next) => {
  try {
    const user = await UsersModel.findByIdAndUpdate(
      req.user._id,
      {
        refreshToken: "",
      },
      { new: true }
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/session/refresh", jwtAuth, async (req, res, next) => {
  try {
    const { currentRefreshToken } = req.body;
    const { accessToken, refreshToken } = await verifyAndRefreshTokens(
      currentRefreshToken
    );
    res.send({ accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
});
usersRouter.get(
  "/:userId",
  jwtAuth,
  adminOnlyMiddleware,
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

usersRouter.put(
  "/:userId",
  jwtAuth,
  adminOnlyMiddleware,
  async (req, res, next) => {
    await user.save();
    try {
      const userId = req.params.userId;
      const updates = req.body; // Assume that updates are sent in the body of the request

      const user = await UsersModel.findById(userId);

      if (!user) {
        return next(createError(404, "User not found"));
      }

      for (let key in updates) {
        if (user[key] !== undefined) {
          // only allow updating existing fields
          user[key] = updates[key];
        }
      }
      await user.save();

      res.send({
        message: "User data updated successfully",
        updatedUser: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

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
