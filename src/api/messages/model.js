import mongoose from "mongoose";

const { Schema, model } = mongoose;

const messageSchema = new Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      text: { type: String, required: true },
      media: { type: String, required: false }
    }
  },
  { timestamps: true }
);

const Message = model("Message", messageSchema);

export default Message;
