const router = require("express").Router();
const mongoose = require("mongoose");
const Conversation = require('../models/Conversation.js');
const Message = require("../models/Message.js");
const User = require('../models/Users');
const verifyToken = require('../utility-functions/verifyToken');
const jwtDecode = require("jwt-decode");
const uuidv4 = require("uuid").v4;
const cors = require("cors");
const express = require("express");




router.post("/create_conversation",verifyToken,cors({origin:"*"}),async(req,res)=>{
   const authHeader = req.headers["authorization"];
   const token = authHeader && authHeader.split(' ')[1];
   const userTokenId = jwtDecode(token).id;
   let user,messageId = req.body.userId,messagedUser;
   messagedId = req.body.userId;
   try{
     user = await User.findById(userTokenId);
   } catch{
     return res.sendStatus(404);
   }

   try{
     messagedUser = await User.findById(messageId);
   } catch{
     return res.sendStatus(401);
   }

   if(user && messagedUser)
   {
     const findUserPartener = user._doc.conversationsParteners.find(usr=> usr.id == messageId);
     if(!findUserPartener)
     {
     	const convObjUser = {
          id:user._doc._id,
          profilePicture:user._doc.profilePicture,
          username:user._doc.username
      }

      const convObjMessaged = {
          id:messagedUser._doc._id,
          profilePicture:messagedUser._doc.profilePicture,
          username:messagedUser._doc.username
      }
     const obj = [convObjUser,convObjMessaged];
     const cvId = uuidv4();

  	try{
  	  await User.updateOne(
  	  {"_id":userTokenId},
  	  {$push:{"conversations":cvId}});

      await User.updateOne(
        {"_id":userTokenId},
        {$push:{"conversationsParteners":convObjMessaged}}
      );

  	    await User.updateOne(
  	  {"_id":messageId},
  	  {$push:{"conversations":cvId}}
  	  );

      await User.updateOne(
        {"_id":messageId},
        {$push:{"conversationsParteners":convObjUser}}
      );
  	}
  	catch{
  	   return res.sendStatus(500);
  	}

       const newConv = new Conversation({
       participants:obj,
       convId:cvId
     });

      newConv.save();

     return res.sendStatus(200);
     } else {
     	return res.status(200).json("Already exists");
     }

   } else{
     return res.sendStatus(404);
   }

   return res.sendStatus(200);
});


router.get("/messages-conv",verifyToken,async(req,res)=>{


	const convId = req.headers["cvid"];
  console.log(convId);
	const messages = await Message.find({conversationId:convId});

	if(messages!=null)
	{
	 return res.status(200).json(messages);
	}
	return res.status(404);

});

module.exports = router;
