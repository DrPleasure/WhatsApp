import express from "express";
import createHttpError from "http-errors";
import messageModel from "./model.js";
import q2m from "query-to-mongo";
import { adminOnlyMiddleware } from "../../lib/adminOnly.js";
import { JWTAuthMiddleware } from "../../lib/jwtAuth.js";
import { createAccessToken } from "../../lib/tools.js";

const messagesRouter = express.Router();


// GET /messages endpoint to retrieve all messages
messagesRouter.get('/', async (req, res, next) => {
  try {
    const messages = await messageModel.find().exec();
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
});

// GET /messages/:id endpoint to retrieve a specific message by ID
messagesRouter.get('/:id', async (req, res, next) => {
  try {
    const messageId = req.params.id;
    const message = await messageModel.findById(messageId).exec();

    if (!message) {
      return res.status(404).json({ message: `Message with ID ${messageId} not found` });
    }

    res.status(200).json(message);
  } catch (error) {
    next(error);
  }
});

// POST /messages endpoint to create a new message
messagesRouter.post('/', async (req, res, next) => {
  try {
    const { sender, content } = req.body;

    // Check if sender and content fields are present in request body
    if (!sender || !content) {
      return res.status(400).json({ message: 'Sender and content are required fields' });
    }

    const newMessage = await messageModel.create({ sender, content });
    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
});

// PUT /messages/:id endpoint to update an existing message
messagesRouter.put('/:id', async (req, res, next) => {
  try {
    const messageId = req.params.id;
    const { sender, content } = req.body;

    // Check if sender and content fields are present in request body
    if (!sender || !content) {
      return res.status(400).json({ message: 'Sender and content are required fields' });
    }

    const updatedMessage = await messageModel.findByIdAndUpdate(
      messageId,
      { sender, content },
      { new: true }
    ).exec();

    if (!updatedMessage) {
      return res.status(404).json({ message: `Message with ID ${messageId} not found` });
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    next(error);
  }
});

// DELETE /messages/:id endpoint to delete an existing message
messagesRouter.delete('/:id', async (req, res, next) => {
  try {
    const messageId = req.params.id;
    const deletedMessage = await messageModel.findByIdAndDelete(messageId).exec();

    if (!deletedMessage) {
      return res.status(404).json({ message: `Message with ID ${messageId} not found` });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});






export default messagesRouter;
