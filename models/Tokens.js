const mongoose = require("mongoose");
const ttl = require("mongoose-ttl");

const TokenSchema = new mongoose.Schema({
    refreshToken:String,
},{timestamps: true})

TokenSchema.index({createdAt: 1},{expireAfterSeconds: 3600});

module.exports =  mongoose.model('Token',TokenSchema);
