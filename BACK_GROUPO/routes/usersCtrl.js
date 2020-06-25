// Imports
var bcrypt = require('bcrypt');
var jwtUtils = require('../utils/jwt.utils');
const multer = require('../utils/multer-config');

var models = require('../models');
var asyncLib = require('async');

// Constants
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PASSWORD_REGEX = /^(?=.*\d).{5,30}$/;

// Routes
module.exports = {
    register: function (req, res) {

        console.log("req.body222 : " + req.body.image)

        // Params
        var email = req.body.email;
        var username = req.body.username;
        var password = req.body.password;
        var bio = req.body.bio;
        const image = req.body.image;

        if (email == null || username == null || password == null) {
            return res.status(400).json({ 'error': 'missing parameters' });
        }

        if (username.length >= 13 || username.length <= 4) {
            return res.status(400).json({ 'error': 'wrong username (must be  length 5 - 12)' });
        }

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ 'error': 'email is not valid' });
        }

        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({ 'error': 'password invalid (must length 5 - 30 and include 1 number at least)' });
        }

        asyncLib.waterfall([
            function (done) {
                models.User.findOne({
                    attributes: ['email'],
                    where: { email: email }
                })
                // models.User.findOne({
                //     attributes: ['user'],
                //     where: { user: user }
                // })
                    .then(function (userFound) {
                        done(null, userFound);
                    })
                    .catch(function (err) {
                        return res.status(500).json({ 'error': 'unable to verify user' });
                    });
            },
            function (userFound, done) {
                if (!userFound) {
                    bcrypt.hash(password, 5, function (err, bcryptedPassword) {
                        done(null, userFound, bcryptedPassword);
                    });
                } else {
                    return res.status(409).json({ 'error': 'user already exist' });
                }
            },
            function (userFound, bcryptedPassword, done) {
                var newUser = models.User.create({
                    email: email,
                    username: username,
                    password: bcryptedPassword,
                    bio: bio,
                    isAdmin: 0,
                    image: image,
                })
                    .then(function (newUser) {
                        done(newUser);
                    })
                    .catch(function (err) {
                        return res.status(500).json({ 'error': 'cannot add user' });
                    });
            }
        ], function (newUser) {
            if (newUser) {
                return res.status(201).json({
                    'userId': newUser.id
                });
            } else {
                return res.status(500).json({ 'error': 'cannot add user' });
            }
        });
    },
    login: function (req, res) {

        // Params
        var username = req.body.username;

        // var email = req.body.email;
        var password = req.body.password;

        // if (email == null || password == null) {
        if (username == null || password == null) {

            return res.status(400).json({ 'error': 'missing parameters' });
        }

        asyncLib.waterfall([
            function (done) {
                models.User.findOne({
                    // where: { email: email }
                    where: { username: username }

                })
                    .then(function (userFound) {
                        done(null, userFound);
                    })
                    .catch(function (err) {
                        return res.status(500).json({ 'error': 'unable to verify user' });
                    });
            },
            function (userFound, done) {
                if (userFound) {
                    bcrypt.compare(password, userFound.password, function (errBycrypt, resBycrypt) {
                        done(null, userFound, resBycrypt);
                    });
                } else {
                    return res.status(404).json({ 'error': 'user not exist in DB' });
                }
            },
            function (userFound, resBycrypt, done) {
                if (resBycrypt) {
                    done(userFound);
                } else {
                    return res.status(403).json({ 'error': 'invalid password' });
                }
            }
        ], function (userFound) {
            if (userFound) {
                return res.status(201).json({
                    'userId': userFound.id,
                    'isAdmin':userFound.isAdmin,
                    'image': userFound.image,
                    'username': userFound.username,
                    'email': userFound.email,
                    'token': jwtUtils.generateTokenForUser(userFound)
                });
            } else {
                return res.status(500).json({ 'error': 'cannot log on user' });
            }
        });
    },
    getUserProfile: function (req, res) {
        // Getting auth header
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if (userId < 0)
            return res.status(400).json({ 'error': 'wrong token' });

        models.User.findOne({
            attributes: ['id', 'email', 'username', 'bio'],
            where: { id: userId }
        }).then(function (user) {
            if (user) {
                res.status(201).json(user);
            } else {
                res.status(404).json({ 'error': 'user not found' });
            }
        }).catch(function (err) {
            res.status(500).json({ 'error': 'cannot fetch user' });
        });
    },
    listUsers: function (req, res) {
        var fields = req.query.fields;
        // var limit = parseInt(req.query.limit);
        var offset = parseInt(req.query.offset);
        var order = req.query.order;
        console.log(req.query)
        // if (limit > ITEMS_LIMIT) {
        //     limit = ITEMS_LIMIT;
        // }

        models.User.findAll({
            order: [(order != null) ? order.split(':') : ['updatedAt', 'DESC']],
            // attributes: (fields !== '*' && fields != null) ? fields.split(',') : null,
            // limit: (!isNaN(limit)) ? limit : null,
            // offset: (!isNaN(offset)) ? offset : null,
            // include: [{
            //     model: models.User,
            //     attributes: ['username']
            // }]
        }).then(function (users) {
            if (users) {
                res.status(200).json(users);
                console.log(users)
            } else {
                res.status(404).json({ "error": "no users found" });
            }
        }).catch(function (err) {
            console.log(err);
            res.status(500).json({ "error": "invalid fields" });
        });
    },
    updateUserProfile: function (req, res) {
        // Getting auth header
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);
        console.log("userId : " + userId);
        // Params
        var email = req.body.email;
        var username = req.body.username;
        var password = req.body.password;
        const image = req.body.image;      
    //     imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    // });
        console.log("username : " + username);

        asyncLib.waterfall([
            function (done) {
                // function (done) {
                    models.User.findOne({
                        // where: { email: email }
                        where: { id : userId }

                //     })
                // models.User.findOne({
                //     attributes: ['id'],
                //     where: { username: username }
                }).then(function (userFound) {
                    done(null, userFound);
                    console.log("userfoun : " + userFound)
                })
                    .catch(function (err) {
                        console.log("err : " +err)
                        return res.status(500).json({ 'error': err });
                    });
            },
            function (userFound, done) {
                if (userFound) {
                    userFound.update({
                        // bio: (bio ? bio : userFound.bio)
                         email: email,
                        username: username,
                        // password: bcryptedPassword,
                        // bio: bio,
                        // isAdmin: 0,
                        image: image,
                    }).then(function () {
                        done(userFound);
                    }).catch(function (err) {
                        res.status(500).json({ 'error': 'cannot update user' });
                    });
                } else {
                    res.status(404).json({ 'error': 'user not found' });
                }
            },
        ], function (userFound) {
            if (userFound) {
                return res.status(201).json(userFound);
            } else {
                return res.status(500).json({ 'error': 'cannot update user profile' });
            }
        });
    },
    deleteUserProfile: function (req, res) {
        // Getting auth header
        var headerAuth = req.headers['authorization'];
        let userId = 0;
        // var userId = req.body.userId ;
        console.log("first userId : " + userId)
        console.log("req.body.userId : " + req.body.userId)
        if (req.body.userId!==undefined) {
            userId = req.body.userId } else {
            console.log("else userId : " + userId)
            userId =jwtUtils.getUserId(headerAuth)
            console.log("admin userId : " + userId)
            };

        console.log("userId : " + userId)
// userId=2

        asyncLib.waterfall([
            function (done) {
                models.User.findOne({
                    // attributes: ['id', 'bio'],
                    where: { id: userId }
                }).then(function (userFound) {
                    done(null, userFound);
                })
                    .catch(function (err) {
                        return res.status(500).json({ 'error': 'unable to verify user' });
                    });
            },
            function (userFound, done) {
                if (userFound) {
                    models.User.destroy({
                        where: { id: userId }
                    })
                        .then(function () {
                            done(userFound);
                            // res.status(200).json({ 'success': 'user ' + userId + ' deleted' });
                        })
                        .catch(function (err) {
                            res.status(500).json({ 'error': 'cannot fetch user' });
                        });
                } else {
                    res.status(404).json({ 'error': 'user not found' });
                }
            },
        ], function (userFound) {
            if (userFound) {
                return res.status(201).json(userFound);
            } else {
                return res.status(500).json({ 'error': 'cannot update user profile' });
            }
        });




        // if (userId < 0)
        //     return res.status(400).json({ 'error': 'wrong token' });

        // models.User.destroy({
        //     where: { id: userId }
        // })
        // .then(function () {

        //     res.status(200).json({ 'success': 'user ' + userId + ' deleted' });
        // })
        // .catch(function (err) {
        //     res.status(500).json({ 'error': 'cannot fettttch user' });
        // });


    },
}