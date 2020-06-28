// Imports
var jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SIGN_SECRET = process.env.JWTKEY

// Exported functions
module.exports = {
    generateTokenForUser: function (userData) {
        console.log(userData.dataValues);
        return jwt.sign({
            userId: userData.id,
            isAdmin: userData.isAdmin
        },
            JWT_SIGN_SECRET,
            {
                expiresIn: '1h'
            })
    },
    parseAuthorization: function (authorization) {
        // console.log("parse auth : " + authorization.replace('Bearer ', '') )

        return (authorization != null) ? authorization.replace('Bearer ', '') : null;
    },
    getUserId: function (authorization) {
        var userId = -1;
       let token = module.exports.parseAuthorization(authorization);
        // token=JSON.parse(token)
        if (token != null) {
            try {
                var jwtToken = jwt.verify(token, JWT_SIGN_SECRET);
                if (jwtToken != null)
                    userId = jwtToken.userId;
            } catch (err) { }
        }
        return userId;
    }
}