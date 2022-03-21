const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender:String,
  content:String,
  conversationId:String
});

module.exports = new mongoose.model('Message',MessageSchema);
