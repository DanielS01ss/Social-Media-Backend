const validateBase64 = function(encoded1) {
       var decoded1 = Buffer.from(encoded1, 'base64').toString('utf8');
       var encoded2 = Buffer.from(decoded1, 'binary').toString('base64');
       return encoded1 == encoded2;
}

module.exports = validateBase64;
 
