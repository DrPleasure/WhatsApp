import mongoose from "mongoose";
import messageSchema from "../messages/model.js";

const { Schema, model } = mongoose;

const chatSchema = new Schema(
  {
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    messages: [
      messageSchema
    ]
  },
  { timestamps: true }
);



export default model("Chat", chatSchema);
