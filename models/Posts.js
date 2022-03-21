const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  userId:String,
  desc:{
    type:String,
    max:500
  },
  img:{
    type:String,
  },
  likes:{
    type:Array,
    default:[],
  },
  comments:{
    type:Array,
    default:[]
  },
  postHolder:Object
},{timestamps:true});

module.exports = new mongoose.model("Posts",PostSchema);
