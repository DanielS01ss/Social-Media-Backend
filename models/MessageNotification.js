const mongoose = require("mongoose");

const MessageNotificationSchema = new mongoose.Schema({
  sender:Object,
  userId:String
});

module.exports = new mongoose.model("MessageNotification",MessageNotificationSchema);
