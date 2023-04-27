import mongoose from "mongoose";

const { Schema, model } = mongoose;

const MessageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    content: {
      text: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

const ChatSchema = new Schema(
  {
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

export default model("Chat", ChatSchema);
