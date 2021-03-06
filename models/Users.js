const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

  username:{
    type:String,
    require:true,
    min:3,
    max:30
  },
  posts:[
    {
      postId:String
    }
  ],
  password:
  {
    type:String,
    required:true,
    max:50,
    min:5
  },
  email:{
    type:String,
    required:true,
  },
  profilePicture:String,
  coverPicture:String,
  followers:{
    type:Array,
    default:[]
  },
  followings:{
    type:Array,
    default:[]
  },
  isAdmin:{
    type:Boolean,
    default:false
  },
  description:{
    type:String,
    default:"",
    max:50,
  },
  livesIn:{
    type:String,
    max:50,
    default:""
  },
  from:{
    type:String,
    max:50,
    default:""
  },
  relationship:{
    type:Number,
    enum:[0,1,2,3],
    default:0
  },
  education:{
    type:String,
    max:50,
    default:""
  },
  conversations:{
    type:Array,
    default:[]
  },
  conversationsParteners:{
    type:Array,
    default:[]
  }
},
{timestamps:true});

UserSchema.index({username:'text'});

module.exports = mongoose.model("User",UserSchema);
