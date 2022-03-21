const router = require("express").Router();
const verifyToken = require('../utility-functions/verifyToken');
const messageNotification = require("../models/MessageNotification");
const Notification = require("../models/Notification");
const jwtDecode = require("jwt-decode");

router.get("/notifications",verifyToken,async(req,res)=>{
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(' ')[1];
  const userTokenId = jwtDecode(token).id;

  const notifications = await Notification.find({ownerId:userTokenId});
  if(notifications!=null)
	{
	 return res.status(200).json(notifications);
	}
	return res.status(404);

});

router.get("/messagenotifications",verifyToken,async(req,res)=>{
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(' ')[1];
  const userTokenId = jwtDecode(token).id;

  const messages = await messageNotification.find({userId:userTokenId});
  if(messages!=null)
	{
	 return res.status(200).json(messages);
	}
	return res.status(404);

});


router.delete("/messagenotifications",verifyToken,async(req,res)=>{
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(' ')[1];
  const userTokenId = jwtDecode(token).id;

 try{
     await messageNotification.deleteMany({userId:userTokenId});
 } catch{
   return res.status(500);
 }
  return res.status(200);
});



router.delete("/notifications",verifyToken,async(req,res)=>{
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(' ')[1];
  const userTokenId = jwtDecode(token).id;

  try{
    await Notification.deleteMany({ownerId:userTokenId});

  } catch{
    return res.status(500);
  }
   return res.status(200);

});


router.post("/send-notifications",verifyToken,async(req,res)=>{
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(' ')[1];
  const userTokenId = jwtDecode(token).id;

  ///owner e cel la care trimit notificarea
    const newNotif = new Notification({
      userActioned:req.body.user,
      ownerId:req.body.recipientId,
      img:req.body.img,
      notificationType:req.body.notificationType
    })


     newNotif.save();

  return res.status(200);
});

 module.exports = router;
