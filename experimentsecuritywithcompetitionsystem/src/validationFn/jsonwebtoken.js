var jwt = require('jsonwebtoken');
const { isMainThread } = require('worker_threads');
var config = require('../config/config');

var verifyFn = {
    getIdInfo: function (req, res, next) {
        var token = req.headers['authorization'];
        
        res.type('json');

        if (!token || !token.includes("Bearer ")) {
            res.status(403);
            res.send(`{"message":"Not Authorized"}`);
        } else {
            token = token.substring(7);
            jwt.verify(token, config.JWTKey, function (err, decoded) {
                if (err) {
                    res.status(403);
                    res.send(`{"Message":" Not Authorized"}`);
                } else {
                    req.id = decoded.id;
                    next();
                }
            })

        }

    }
}

module.exports = verifyFn;


