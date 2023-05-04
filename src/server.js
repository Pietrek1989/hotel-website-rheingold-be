import Express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { createServer } from "http";
import { newConnectionHandler } from "./api/chat/index.js";
import {
  badRequestHandler,
  unauthorizedHandler,
  notfoundHandler,
  genericErrorHandler,
  forbiddenErrorHandler,
} from "./errorhandlers.js";
import usersRouter from "./api/users/index.js";
import createHttpError from "http-errors";
import passport from "passport";
import { googleStrategy } from "./lib/auth/googleOAuth.js";
import chatsRouter from "./api/chat/index.js";
import reservationsRouter from "./api/reservations/index.js";
import listEndpoints from "express-list-endpoints";
import offersRouter from "./api/offfer/index.js";
import cron from "node-cron";
import removeExpiredReservations from "./cronExpire.js";
import stripeRouter from "./api/payment/index.js";

const server = Express();
const port = process.env.PORT || 3420;
const whitelist = [process.env.FE_URL, process.env.FE_PROD_URL];

passport.use("google", googleStrategy);

server.use(
  cors({
    origin: (currentOrigin, corsNext) => {
      if (!currentOrigin || whitelist.indexOf(currentOrigin) !== -1) {
        corsNext(null, true);
      } else {
        corsNext(
          createHttpError(400, `Origin ${currentOrigin} is not whitelisted.`)
        );
      }
    },
  })
);

server.use(Express.json());
server.use(passport.initialize());

server.use("/users", usersRouter);
server.use("/chats", chatsRouter);
server.use("/reservations", reservationsRouter);
server.use("/offers", offersRouter);
server.use("/payments", stripeRouter);

server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(forbiddenErrorHandler);
server.use(notfoundHandler);
server.use(genericErrorHandler);

const httpServer = createServer(server);
export const io = new Server(httpServer);
io.on("connection", newConnectionHandler);

mongoose.connect(process.env.MONGO_URL);

// const cronExpression = "0 0 * * *"; // Run the job every day at 00:00
// cron.schedule(cronExpression, removeExpiredReservations);

mongoose.connection.on("connected", () => {
  httpServer.listen(port, () => {
    console.table(listEndpoints(server));
    console.log(`Server is running on port ${port}`);
  });
});
