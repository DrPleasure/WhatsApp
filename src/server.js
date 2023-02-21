import express from "express";
import listEndpoints from "express-list-endpoints";
import cors from "cors";
import {
  badRequestHandler,
  genericServerErrorHandler,
  notFoundHandler,
  unauthorizedHandler,
} from "./errorHandlers.js";

import usersRouter from "./api/users/index.js";
import chatsRouter from "./api/chats/index.js";
import messagesRouter from "./api/messages/index.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { newConnectionHandler } from "./socket/index.js";
import { Server } from "socket.io";
import { createServer } from "http"; // CORE MODULE
dotenv.config();
const server = express();
const port = process.env.PORT || 3001;

// ************************************ SOCKET.IO ********************************
const httpServer = createServer(server);
const io = new Server(httpServer); // this constructor is expecting to receive an HTTP-SERVER as parameter not an EXPRESS SERVER!!!

// io.on("connection", newConnectionHandler);
io.on("connect", newConnectionHandler);

server.use(cors());
server.use(express.json());

server.use("/users", usersRouter);
server.use("/chats", chatsRouter);
server.use("/messages", messagesRouter);

server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(notFoundHandler);
server.use(genericServerErrorHandler);

mongoose.connect(process.env.MONGO_URL);

mongoose.connection.on("connected", () => {
  console.log("Successfully connected to Mongo!");
  server.listen(port, () => {
    console.table(listEndpoints(server));
    console.log(`Server is running on port ${port}`);
  });
});
