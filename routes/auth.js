const router = require("express").Router();
require("dotenv").config();
const bcrypt = require("bcrypt");
const User = require('../models/Users');
const Token = require("../models/Tokens");
const {check,validationResult,checkBody} = require('express-validator');
const validator = require('email-validator');
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const verifyToken = require('../utility-functions/verifyToken.js');
const jwtDecode = require("jwt-decode");

const registerValidate = [
  check('username').isLength({min:8}).escape().trim(),
  check('email','This must be an email').isEmail()
];



router.post('/register',
 registerValidate,
async(req,res)=>{

 if(req.body.email && req.body.password && req.body.username)
 {
    if(!validator.validate(req.body.email))
    {
      return res.status(401).json('Invalid email');
    }
    try{
      const countUsername = await User.countDocuments({username:req.body.username});
      const countEmail = await User.countDocuments({email:req.body.email});

      if(countUsername && countEmail)
      {
        return res.status(422).send("Username and email already exists!");
      } else if(countUsername)
      {
        return res.status(422).send("Username already exists!");
      } else if(countEmail)
      {
        return res.status(422).send("Email already exists!");
      }

      const defaultProfilePic = fs.readFileSync("./images/default-user.jpg");
      const defaultBackgroundPic = fs.readFileSync("./images/default-background.jpg");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password,salt);
      const defBkgData = defaultBackgroundPic.toString("base64");
      const defProfPic = defaultProfilePic.toString("base64");
      const newUser = new User({
        username:req.body.username,
        email:req.body.email,
        password:hashedPassword,
        profilePicture:defaultProfilePic.toString("base64") ,
        coverPicture:defBkgData
      });
       newUser.save();

      res.status(200).json();
    } catch(err)
    {
       console.log("I got an error:",err);
      res.status(500).json(err);
    }
 }
 else{
  return res.status(400).json('Invalid request');
 }
});


router.post('/login',async(req,res)=>{

  if(req.body.email && req.body.password)
  {
    try{
      const user = await User.findOne({email:req.body.email});
      if(user)
      {
        const validPassword = await bcrypt.compare(req.body.password,user.password);
        if(!validPassword)
        {
          return res.status(403).json("Forbidden");
        }
        else{
          const myUser = {
            id:user._id
          }

          const signed = jwt.sign(myUser,"LnmJrFyTqnzf0ZC6CqblvQrMeUJ535gbq6fDRROKIhBbrkGL4jx5rM1nLMGplPV6",{expiresIn:'2h'});
          const refreshTk = jwt.sign({id:1},"4IxUQLW02VCHHl5HIwv4q6LP98OfPujaLBYYal56RvAhVfJHkmal6sqlMIboLhOt");
          const tkModel = new Token();
          tkModel.refreshToken = refreshTk;
          tkModel.save();
          return res.status(200).json({
            token:signed,
            refreshToken:refreshTk,
            user:user
          });
        }
      }
      else{
        return res.status(401).json("Did not found user");
      }
    } catch(err)
    {
      console.log(err);
      res.status(404).json('Error');
    }
  }
  else{
    return res.status(400).json('Provide email and/or password')
  }
});


router.get("/test",verifyToken,(req,res)=>{
  console.log(req.body);
  res.send(200);
})

router.post("/checkToken",(req,res)=>{

  jwt.verify(req.body.token,"LnmJrFyTqnzf0ZC6CqblvQrMeUJ535gbq6fDRROKIhBbrkGL4jx5rM1nLMGplPV6",(err,user)=>{
    console.log(err);
    if(err)
      return res.sendStatus(403);

  })

  return res.sendStatus(200);
});



router.post('/token',async(req,res)=>{
  console.log(req.body);
   let refreshToken = req.body.token;
  //let refreshToken = req.body.token;
  if(refreshToken  == null)
    return res.sendStatus(401);
  const id = jwtDecode(refreshToken).id;
  refreshToken = refreshToken.trim();
  if(!id)
  {
    return res.status(400);
  }
  const myUser = {
    id:id
  }

  const dbToken = await Token.countDocuments({refreshToken:refreshToken});
  const signed = jwt.sign(myUser,"LnmJrFyTqnzf0ZC6CqblvQrMeUJ535gbq6fDRROKIhBbrkGL4jx5rM1nLMGplPV6",{expiresIn:'2h'});
  console.log(signed);
  if(dbToken)
  {

    return res.json({token:signed});
  } else {
    return res.sendStatus(401);
  }

  return res.sendStatus(200);
})

router.post("/user",verifyToken,async(req,res)=>{
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(' ')[1];
  const user = jwtDecode(token).id;
  const userFound = await User.findById(user);


  return res.end(JSON.stringify({user:userFound}));
})


router.post("/create_conversation",(req,res)=>{
   console.log(req.body);
   return res.sendStatus(401);
});


router.get("/data",verifyToken,(req,res)=>{
  res.send(200);
})

router.delete("/logout",async(req,res)=>{
  try{
  	const deleteRes = await Token.deleteOne({refreshToken:req.body.token});
       res.sendStatus(200);
  } catch(err)
  {
     return res.sendStatus(500);
  }
});



module.exports = router;
