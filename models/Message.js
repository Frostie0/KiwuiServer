import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
  },
  senderId: {
    type: String,
    required: true,
  },
  receverId: {
    type: String,
    required: true,
  },
   messages: [
    {
      sender: {
        type: String,
        required: true
      },
      message: {
        type: String,
        required: true
      },
      type:{
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }
  ],

})

export const Message = mongoose.model("Message", messageSchema);

export default Message
