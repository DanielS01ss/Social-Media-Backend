const express = require("express");
const app = express();
const mongoose = require("mongoose");
const auth = require("./routes/auth");
const bodyparser = require("body-parser");
const users = require('./routes/user');
const posts = require('./routes/posts');
const cors = require("cors");
const messages = require("./routes/messages.js");
const notifications = require("./routes/notifications.js");
const jwt = require("jsonwebtoken");
const messagesModel = require("./models/Message.js");
const messageNotificationModel = require("./models/MessageNotification.js");
const notificationModel = require("./models/Notification.js");


const jwtDecode = require("jwt-decode");
const io = require('socket.io')(8080,{
	cors:{
	  origin:['*']
	},
});


let connected_people = [];

require('dotenv').config();
app.use(express.json({limit:"25mb"}));
app.use(express.text({limit:"25mb"}));


const start = async ()=>{

  try{
		await mongoose.connect('mongodb+srv://alpha:August2001@cluster0.e377i.mongodb.net/SocialMedia?retryWrites=true&w=majority',{useNewUrlParser:true,useUnifiedTopology:true})
		.then(()=>console.log('connected'))
    .catch(e=>console.log(e));;
	} catch(err)
	{
		console.log(err);
	}

}

start();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

app.use(bodyparser.urlencoded({extended:false}))
app.use('/api/message',messages);
app.use('/api/auth',auth);
app.use('/api/user',users);
app.use('/api/posts',posts);
app.use('/api/notifications',notifications);
app.use(require('sanitize').middleware);
app.get('/',(req,res)=>{
  return res.send('Salut');
})

io.on('connection',(socket)=>{

  let success = true;

		const token = Object.keys(socket.handshake.query)[0];
 		if (token == null)
		{
			socket.disconnect();
			return;
		}
		jwt.verify(token,"LnmJrFyTqnzf0ZC6CqblvQrMeUJ535gbq6fDRROKIhBbrkGL4jx5rM1nLMGplPV6",(err,user)=>{
			if(err)
			{
				success = false;
				return;
			}
		});

   	if(!success)
	 {
	 	 socket.emit('error');
		 socket.disconnect();
		 return;
	 }
console.log("User connected succesfully");

	const userIdFromToken = jwtDecode(token).id;
	const userData = {
		socketId:socket.id,
		userId:userIdFromToken
	}
	connected_people.push(userData);

	socket.on('like',(user,likedPostData)=>{
		console.log("dsaldfjfdsdkjslsdhlsjhglojgfofdgojhfdghofdgfhfg");
		console.log(Object.keys(user));
		console.log(Object.keys(likedPostData));
	})


  socket.on('custom-event',(number1,number2)=>{
  	console.log(`${number1} and ${number2}`);
  });


///aici cand primesc mesaj de pe frontend
///vreau sa salvez si notificare


socket.on('send-message',(msg,convId,senderId,recepientId,senderObj)=>{

	const m = new messagesModel({
	   sender:senderId,
	   content:msg,
	   conversationId:convId
	});

	const newNotification = new messageNotificationModel({
	sender:senderObj,
	userId:recepientId
	});

	newNotification.save();

	const man = connected_people.find(pers=>pers.userId == recepientId);

	if(man!=undefined)
	{

		  const mSend = {
			   sender:senderId,
			   content:msg,
			   conversationId:convId
			};

			console.log(convId);
			console.log(man.socketId);
			socket.to(man.socketId).emit('sended-message',mSend);
			socket.to(man.socketId).emit('messagenotification',newNotification);
	}

 ///o data ce mesajul a fost trimis emitem si notificare


	///si putem sa si emitem pentru frontend
	//daca e emitem notificare



	m.save()
	.then(()=>{
	   io.emit('receive-message','Message recieved!');
	})
	.catch(error=>console.log(error))
  });

  socket.on('disconnect',function(){
		connected_people = connected_people.filter(cn=> cn.userId!=userIdFromToken);
		console.log(connected_people);
  	console.log("User was disconnected!");
  })
})



app.listen(process.env.PORT,()=>{
 console.log('Salutare frate!');
});
