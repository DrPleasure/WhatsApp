import express from "express";
import createHttpError from "http-errors";
import q2m from "query-to-mongo";
import { adminOnlyMiddleware } from "../../lib/adminOnly.js";
import { JWTAuthMiddleware } from "../../lib/jwtAuth.js";
import { createAccessToken } from "../../lib/tools.js";
import { validate } from "../../lib/tools.js";
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import  Message  from "./model.js";
import { Chat as chatModel } from "../chats/model.js";

const messagesRouter = express.Router();


// // GET /messages endpoint to retrieve all messages
// messagesRouter.get('/', async (req, res, next) => {
//   try {
//     const messages = await chatModel.find().exec();
//     res.status(200).json(messages);
//   } catch (error) {
//     next(error);
//   }
// });

// // GET /messages/:id endpoint to retrieve a specific message by ID
// messagesRouter.get('/:id', async (req, res, next) => {
//   try {
//     const messageId = req.params.id;
//     const message = await chatModel.findById(messageId).exec();

//     if (!message) {
//       return res.status(404).json({ message: `Message with ID ${messageId} not found` });
//     }

//     res.status(200).json(message);
//   } catch (error) {
//     next(error);
//   }
// });

// POST /messages endpoint to create a new message
messagesRouter.post('/:chatId', JWTAuthMiddleware, async (req, res, next) => {
    try {
      const { content } = req.body;
      const sender = req.user._id;
  
      // Check if content field is present in request body
      if (!content) {
        return res.status(400).json({ message: 'Content is a required field' });
      }
  
      const newMessage = new Message({
        sender,
        content,
      });
  
      const chat = await chatModel.findById(req.params.chatId)
  
      // Check if the chat exists
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
  
      // Check if the user is a member of the chat
      const isMember = chat.members.some((id) => id.equals(sender));
      if (!isMember) {
        return res.status(403).json({ message: 'You are not a member of this chat' });
      }
  
      // Add the message to the chat
      if (!chat.messages) {
        chat.messages = [newMessage];
      } else {
        chat.messages.push(newMessage);
      }

      await newMessage.save()
      await chat.save();
  
      // Emit the new message to all members of the chat
      req.io.to(req.params.chatId).emit('newMessage', newMessage);
  
      res.status(201).json(newMessage);
    } catch (error) {
      next(error);
    }
  });
  
  // GET /messages/:id endpoint to retrieve a specific message by ID
  messagesRouter.get('/:chatId/:messageId', JWTAuthMiddleware, async (req, res, next) => {
    try {
      const { chatId, messageId } = req.params;
      const userId = req.user._id;
    
      const chat = await chatModel
        .findById(chatId)
        .populate('members', '-password')
        .populate({
          path: 'messages',
          match: { _id: messageId },
          populate: {
            path: 'sender',
            model: 'User',
            select: 'username',
          },
        })
        .exec();
    
      // Check if the chat exists
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
    
      // Check if the user is a member of the chat
      const isMember = chat.members.some((member) => member._id.equals(userId));
      if (!isMember) {
        return res.status(403).json({ message: 'You are not a member of this chat' });
      }
    
      // Check if the message exists
      const message = chat.messages.find((msg) => msg._id.equals(messageId));
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }
    
      const { sender, content } = message;
    
      res.status(200).json({ sender: sender.username, content });
    } catch (error) {
      next(error);
    }
  });
  
  

// // PUT /messages/:id endpoint to update an existing message
// messagesRouter.put('/:id', async (req, res, next) => {
//   try {
//     const messageId = req.params.id;
//     const { sender, content } = req.body;

//     // Check if sender and content fields are present in request body
//     if (!sender || !content) {
//       return res.status(400).json({ message: 'Sender and content are required fields' });
//     }

//     const updatedMessage = await chatModel.findByIdAndUpdate(
//       messageId,
//       { sender, content },
//       { new: true }
//     ).exec();

//     if (!updatedMessage) {
//       return res.status(404).json({ message: `Message with ID ${messageId} not found` });
//     }

//     res.status(200).json(updatedMessage);
//   } catch (error) {
//     next(error);
//   }
// });

// // DELETE /messages/:id endpoint to delete an existing message
// messagesRouter.delete('/:id', async (req, res, next) => {
//   try {
//     const messageId = req.params.id;
//     const deletedMessage = await chatModel.findByIdAndDelete(messageId).exec();

//     if (!deletedMessage) {
//       return res.status(404).json({ message: `Message with ID ${messageId} not found` });
//     }

//     res.status(204).send();
//   } catch (error) {
//     next(error);
//   }
// });






export default messagesRouter;
