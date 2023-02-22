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
import passport from "passport";
import googleStrategy from "./lib/google.js";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createServer } from "http"; // CORE MODULE
dotenv.config();
const server = express();
const port = process.env.PORT || 3001;
passport.use("google", googleStrategy);
// Initialize socketio
const httpServer = createServer(server);
const io = new Server(httpServer);

io.on("connection", (socket) => {
  console.log("Socket connected: " + socket.id);

  // Join chat room
  socket.on("joinChatRoom", (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined room ${chatId}`);
  });

  // Leave chat room
  socket.on("leaveChatRoom", (chatId) => {
    socket.leave(chatId);
    console.log(`Socket ${socket.id} left room ${chatId}`);
  });
});

server.use(cors());
server.use(express.json());

server.use((req, res, next) => {
  req.io = io;
  next();
});

server.use("/users", usersRouter);
server.use("/chats", chatsRouter);
server.use("/messages", messagesRouter);
server.use(passport.initialize());

server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(notFoundHandler);
server.use(genericServerErrorHandler);

mongoose.connect(process.env.MONGO_URL);

mongoose.connection.on("connected", () => {
  console.log("Successfully connected to Mongo!");
  httpServer.listen(port, () => {
    console.table(listEndpoints(server));
    console.log(`Server is running on port ${port}`);
  });
});
