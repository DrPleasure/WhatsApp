import express from "express";
import createHttpError from "http-errors";
import chatModel from "./model.js";
import q2m from "query-to-mongo";
import { adminOnlyMiddleware } from "../../lib/adminOnly.js";
import { JWTAuthMiddleware } from "../../lib/jwtAuth.js";
import { createAccessToken } from "../../lib/tools.js";
import userModel from "../users/model.js"

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
  chatsRouter.post("/", JWTAuthMiddleware, async (req, res, next) => {
    try {
      const { recipients } = req.body;
      const userId = req.user._id;
      const memberIds = [userId];
      let members = [userId];
  
      if (recipients && Array.isArray(recipients)) {
        for (let recipient of recipients) {
          const existingRecipient = await userModel.findById(recipient);
          if (!existingRecipient) {
            throw createHttpError(404, `User with id ${recipient} not found`);
          }
          if (existingRecipient._id.toString() === userId.toString()) {
            throw createHttpError(
              400,
              `User with id ${userId} cannot create a chat with themselves`
            );
          }
          memberIds.push(recipient);
          members.push(existingRecipient);
        }
      } else {
        throw createHttpError(400, "Please provide an array of recipients");
      }
  
      const existingChat = await chatModel.findOne({
        members: { $all: memberIds },
      });
      if (existingChat) {
        throw createHttpError(
          400,
          `Chat with members ${memberIds} already exists`
        );
      }
  
      const newChat = new chatModel({ members, messages: [] });
      const savedChat = await newChat.save();
      res.status(201).send(savedChat);
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
