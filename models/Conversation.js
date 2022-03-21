const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
  participants:{
    type:Array,
    default:[]
  },
  convId:String
});

module.exports = new mongoose.model("Conversation",ConversationSchema);
