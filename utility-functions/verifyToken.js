const jwt = require("jsonwebtoken");

function verifyToken(req,res,next){
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(' ')[1];
  if(token == null)
    return res.sendStatus(401);

  jwt.verify(token,"LnmJrFyTqnzf0ZC6CqblvQrMeUJ535gbq6fDRROKIhBbrkGL4jx5rM1nLMGplPV6",(err,user)=>{
    console.log(err);
    if(err)
      return res.sendStatus(403);
    next();
  })
}

module.exports = verifyToken;
