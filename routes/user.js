const router = require("express").Router();
const mongoose = require("mongoose");
const User = require("../models/Users");
const validator = require("email-validator");
const bcrypt = require("bcrypt");
const validateBase64 = require("../utility-functions/verifyBase64.js");
const {check,validationResult,checkBody} = require('express-validator');
const verifyToken = require("../utility-functions/verifyToken");
const escape = require("escape-html")
const jwtDecode = require("jwt-decode");
const Conversation = require('../models/Conversation.js');
const uuidv4 = require("uuid").v4;


mongoose.set('useFindAndModify', false);



router.put("/:id/update",
verifyToken
,async(req,res)=>{
  if(req.body.userId === req.params.id || req.body.isAdmin)
  {
      try{
        if(req.body.password){
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(req.body.password,salt);
          req.body.password = hashedPassword;
        }
        if(req.body.description)
        {
            req.body.description = escape(req.body.description);
        }
        if(req.body.username)
        {
          req.body.username = escape(req.body.username);
        }
        if(req.body.from)
        {
          req.body.from = escape(req.body.from);
        }
        if(req.body.city)
        {
          req.body.city = escape(req.body.city);
        }
        if(req.body.relationship)
        {
          if( typeof(req.body.relationship)=='number' && (req.body.relationship<0 || req.body.relationship >3))
          {
          	return res.status(400);
          }
          if(typeof(req.body.relationship)!='number')
          {
            return res.status(400);
          }
        }
        if(req.body.education)
        {
          req.body.education = escape(req.body.education);
        }

        const user = await User.findByIdAndUpdate(req.params.id,{$set:req.body});
        res.status(200).json("Account has been updated!");
      } catch(err)
      {
        res.status(500).json(err);
      }
  }
  else{
    return res.status(403).json("You can only update your account!");
  }
});


router.get("/:id",verifyToken,async(req,res)=>{
    try{
      const user = await User.findById(req.params.id);

      const {password,createdAt,updatedAt,...others} = user._doc;
      return res.status(200).json(others);
    } catch(err)
    {
      return res.status(500).json(err);
    }
});
///delete user

router.delete("/:id",async(req,res)=>{
  ///functia este findById and delete
  if(req.body.userId === req.params.id || req.body.isAdmin)
  {
    try{
      const myUser = await User.findByIdAndDelete(req.body.userId);
      res.status(200).json("Account has been deleted");
    } catch(err)
    {
      return res.status(500).json(err);
    }
  } else{
    return res.status(403).json("You can only update your account");
  }
});

//follow a user
router.put('/:id/follow',verifyToken,async(req,res)=>{

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(' ')[1];
  const userTokenId = jwtDecode(token).id;
  let user;
  let toFollow;
  const newConvId = uuidv4();

  console.log("req.params.id:",req.params.id);
  console.log("userTokenId:",userTokenId);
  try{
    user = await User.findById(userTokenId);
  } catch(err){
    console.log(err);
    return res.sendStatus(400);
  }
  try{
    toFollow = await User.findById(req.params.id);
  } catch(err){
    console.log(err);
    return res.sendStatus(400);
  }

///creem o noua conversatie intre userul care primeste follow si cel care da follow


const userData = {
  username:user._doc.username,
  profilePicture:user._doc.profilePicture,
  userId:user._doc._id
};

const toFollowData = {
  username:toFollow._doc.username,
  profilePicture:toFollow._doc.profilePicture,
  userId:toFollow._doc._id
}

console.log(toFollow.followers.username);
console.log( user._doc.username);
const userFollowedFound = toFollow.followers.find(us=> us.username == user._doc.username)!=undefined;

const conversationParticipants = [user._doc._id,toFollow._doc._id];
const newConversation = new Conversation({
  participants:conversationParticipants,
  convId:newConvId
});

if(userFollowedFound){
  return res.sendStatus(400);
}

if(req.params.id == userTokenId)
{
  return res.sendStatus(400).json("You can't follow yourself!");
}


try{
   await user.updateOne({$push:{conversations:newConvId}});
   await user.updateOne({$push:{followings:toFollowData}});
   await toFollow.updateOne({$push:{followers:userData}});
   await toFollow.updateOne({$push:{conversations:newConvId}});
   await newConversation.save();
}
 catch(err)
{
  return res.status(500).json("Error while processing request!");
}

  return res.sendStatus(200);
});

router.put("/:id/unfollow",verifyToken,async(req,res)=>{
  let user;
  let toUnfollowUser;
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(' ')[1];
  const userTokenId = jwtDecode(token).id;



  try{
    user = await User.findById(userTokenId);
  } catch(err){
    return res.sendStatus(400);
  }

  try {
    toUnfollowUser = await User.findById(req.params.id);
  } catch(err){
    return res.sendStatus(404).json("User not found!");
  }

  let findFollowedUser = toUnfollowUser.followers.find(us=> us.username == user._doc.username)!=undefined;
  console.log(findFollowedUser);


  try{
    await user.updateOne({$pull:{followings:{username:toUnfollowUser._doc.username}}});
    await toUnfollowUser.updateOne({$pull:{followers:{username:user._doc.username}}});
    return res.status(200).json("Success");
  } catch(err){
    return res.sendStatus(500);
  }

  return res.sendStatus(200);
});



router.post('/search_user',verifyToken,async(req,res)=>{

	
	if(req.body.searchData && typeof(req.body.searchData) == "string" && req.body.searchData.length>0)
	{
		let user;
		try{
		  // user = await User.find({$text:{$search:req.body.searchData}});
		  user = await User.find({'username':{'$regex':req.body.searchData,'$options':'i'}});
		   return res.status(200).json(user);
		} catch(err){
		   console.log(err);
		   return res.sendStatus(500);
		}

	}
	return res.sendStatus(400);
});


router.post('/create_conversation',verifyToken,async(req,res)=>{

	
	console.log(req.body);
	return res.sendStatus(400);
});




module.exports = router;
