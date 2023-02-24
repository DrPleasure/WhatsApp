import express from "express";
import createHttpError from "http-errors";
import q2m from "query-to-mongo";
import { adminOnlyMiddleware } from "../../lib/adminOnly.js";
import { JWTAuthMiddleware } from "../../lib/jwtAuth.js";
import { createAccessToken } from "../../lib/tools.js";
import userModel from "../users/model.js";
import { Chat } from "./model.js";
const chatModel = Chat;

const chatsRouter = express.Router();

chatsRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const userChats = await chatModel
      .find(
        { members: req.user._id }
        // { messages: 0 } // exclude the messages field
      )

      .populate({
        path: "members",
        select: "userName avatar email",
      })
      .populate({
        path: "messages",
        populate: { path: "sender", select: "userName avatar email" },
      });

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
chatsRouter.get("/:chatId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const chat = await chatModel
      .findOne({ _id: req.params.chatId, members: req.user._id })
      .populate({
        path: "members",
        select: "userName avatar email",
      })
      .populate({
        path: "messages",
        populate: { path: "sender", select: "userName avatar email" },
      });

    // Check if the chat exists
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Populate the messages field with the sender and content fields

    res.json(chat);
  } catch (error) {
    next(error);
  }
});

export default chatsRouter;
