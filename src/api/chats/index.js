import express from "express";
import createHttpError from "http-errors";
import chatModel from "./model.js";
import q2m from "query-to-mongo";
import { adminOnlyMiddleware } from "../../lib/adminOnly.js";
import { JWTAuthMiddleware } from "../../lib/jwtAuth.js";
import { createAccessToken } from "../../lib/tools.js";

const chatsRouter = express.Router();

// GET /chats endpoint to retrieve all chats for the authenticated user
chatsRouter.get('/', JWTAuthMiddleware, async (req, res, next) => {
    try {
      const userChats = await chatModel.find({ members: req.user._id }).exec();
      res.status(200).json(userChats);
    } catch (error) {
      next(error);
    }
  });
  
  // POST /chats endpoint to create a new chat for the authenticated user
  chatsRouter.post('/', JWTAuthMiddleware, async (req, res, next) => {
    try {
      const recipient = req.body.recipient;
      const sender = req.user._id;
  
      // Check if chat with recipient already exists
      const existingChat = await chatModel.findOne({
        members: { $all: [sender, recipient] }
      }).exec();
  
      if (existingChat) {
        res.status(200).json(existingChat);
      } else {
        // Create new chat with recipient
        const newChat = new chatModel({
          members: [sender, recipient],
          messages: []
        });
        const savedChat = await newChat.save();
  
        // Join chat room with sockets
        const chatRoom = `chat_${savedChat._id}`;
        socketio.Socket.in(chatRoom).emit('message', {
          type: 'info',
          message: 'User joined chat room'
        });
        socketio.Socket.connected[socketio.id].join(chatRoom);
  
        res.status(201).json(savedChat);
      }
    } catch (error) {
      next(error);
    }
  });
  


  // GET /chats/:id endpoint to retrieve a specific chat by ID
chatsRouter.get('/:id', JWTAuthMiddleware, async (req, res, next) => {
    try {
      const chatId = req.params.id;
      const chat = await chatModel.findById(chatId).exec();
  
      if (!chat) {
        return res.status(404).json({ message: `Chat with ID ${chatId} not found` });
      }
  
      // Check if authenticated user is a member of the chat
      if (!chat.members.includes(req.user._id)) {
        return res.status(401).json({ message: 'You are not a member of this chat' });
      }
  
      res.status(200).json(chat);
    } catch (error) {
      next(error);
    }
  });
  




export default chatsRouter;
