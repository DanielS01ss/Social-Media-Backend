const router = require("express").Router();
const mongoose = require("mongoose");
const User = require('../models/Users');
const Post = require('../models/Posts');
const {check,validationResult,checkBody} = require('express-validator');
const verifyToken = require('../utility-functions/verifyToken');
const jwtDecode = require("jwt-decode");

const registerValidate = [
  check('description').escape().trim()
]


router.get("/userposts",verifyToken,async(req,res)=>{
  console.log(req.headers);
  let fetchedPosts;
  try{
    fetchedPosts = await Post.find({userId:req.headers.userid});
  } catch(err){
    console.log(err);
    return res.sendStatus(500);
  }

  return res.status(200).json(fetchedPosts);
});

router.post('/create',registerValidate,verifyToken,async(req,res)=>{

   if(!req.body.description || !typeof(req.body.description)=="string" || (typeof(req.body.description)=="string" && req.body.description.length==0))
    {
      return res.sendStatus(400);
    }

    const newPost = new Post();
    newPost.desc = req.body.description;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(' ')[1];
    let reqTokenId;
    let userHolder;
    try{
       reqTokenId = jwtDecode(token).id;
    } catch(err){
   	console.log(err);
      return res.status(400);
    }
    console.log("Passed token check");
    try{
         userHolder = await User.findById(reqTokenId);
    } catch(err)
    {
      console.log(err);
      return res.sendStatus(500);
    }

    if(req.body.postPicture)
    {
        newPost.img = req.body.postPicture;
    }
  if(userHolder)
  {
    const userData = {
      name:userHolder.username,
      profilePicture:userHolder.profilePicture
    }
    newPost.userId = reqTokenId;
    newPost.postHolder = userData;
    let newPostId;
    try{
      newPost.save().then(async(savedDoc)=>{
        newPostId = savedDoc.id;
      });
      const result =  await User.findOneAndUpdate({_id:reqTokenId},{$push:{posts:{"postId":newPostId}}});
      return res.status(200).json(newPostId);
    }catch(err)
    {
	    console.log(err);
      return res.status(500).json("Error while saving post!");
    }
  } else {

     return res.sendStatus(400);
  }
});


router.put("/:id/like",verifyToken,async(req,res)=>{

   const authHeader = req.headers["authorization"];
   const token = authHeader && authHeader.split(' ')[1];
   const userTokenId = jwtDecode(token).id;
   let foundPost;
   try{
      foundPost = await Post.findById(req.params.id);
   } catch(err)
   {
     return res.sendStatus(400);
   }

   const elem = foundPost.likes.find((el)=> el.userId == userTokenId);

   if(foundPost)
   {
     if(!elem)
     {
         try{
             await Post.findOneAndUpdate({_id:req.params.id},{$push:{likes:{"userId":userTokenId}}});
         } catch(err)
         {
            return res.sendStatus(500);
         }
         return res.sendStatus(200);
     } else {
         try{
             await Post.findOneAndUpdate({_id:req.params.id},{$pull:{likes:{"userId":userTokenId}}});
         } catch(err)
         {
            return res.sendStatus(500);
         }
         return res.sendStatus(200);
     }

   } else {
   	console.log("Here");
     return res.sendStatus(400);
   }

  return res.sendStatus(200);
});


router.get("/:id",verifyToken,async(req,res)=>{

  if(req.body.postId)
  {
    try{
      const myPost = await Post.findById(req.body.postId);
      return res.status(200).json(myPost);
    } catch(err)
    {
      console.log(err);
      return res.status(500).json('Error');
    }
  } else{

    return res.status(500).json("Bad request!");
  }

});

const registerValidateComment = [
  check('comment').escape().trim()
]


router.put('/:id/comment',registerValidate , verifyToken,async(req,res)=>{
  console.log(req.body);
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(' ')[1];
  const userTokenId = jwtDecode(token).id;
  let foundUser,foundPost;
  if(req.body.comment && typeof(req.body.comment)=="string" && req.body.comment.length>0)
  {
      try{
        foundUser = await User.findById(userTokenId);
      } catch(err){
        return res.sendStatus(400);
      }

      if(foundUser)
      {
          try{
            foundPost = await Post.findById(req.params.id);
          } catch(err)
          {
            return res.sendStatus(400);
          }
          if(foundPost)
          {
            const updatedComm = {
              userId:userTokenId,
              comment:req.body.comment,
              username:foundUser.username,
              userPhoto:foundUser.profilePicture
            }

          try{
            await Post.findOneAndUpdate({_id:req.params.id},{$push:{comments:updatedComm}});
          } catch(err)
          {
            return res.sendStatus(500);
          }
          return res.sendStatus(200);
          } else {
            return res.sendStatus(400);
          }
      }

  } else {
    return res.sendStatus(400);
  }

});

router.post("/getposts",verifyToken,async(req,res)=>{
	let foundPost;
	const authHeader = req.headers["authorization"];
  	const token = authHeader && authHeader.split(' ')[1];
 	const userTokenId = jwtDecode(token).id;

	try{
	  foundPost = await Post.find({userId:userTokenId});

	} catch(err){
	  return res.sendStatus(400);
	}

   return res.json(foundPost);
});




router.get("/time/all",verifyToken,async(req,res)=>{
   const authHeader = req.headers["authorization"];
   const token = authHeader && authHeader.split(' ')[1];
   const userTokenId = jwtDecode(token).id;

  try{
    const currentUser = await User.findById(userTokenId);
    const userPosts = await Post.find({userId:currentUser._id});
    const friendPosts = await Promise.all(
      currentUser.followings.map((friendId)=>{
          return Post.find({userId:friendId.userId});
      })
    );

    res.json(friendPosts);
  } catch(err)
  {
    console.log(err);
    res.status(500).json(err);
  }
})
module.exports = router;
