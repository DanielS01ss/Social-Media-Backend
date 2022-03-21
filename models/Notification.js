const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userActioned:Object,
  ownerId:String,
  img:String,
  notificationType:Number
});

module.exports = new mongoose.model("Notification",NotificationSchema);
