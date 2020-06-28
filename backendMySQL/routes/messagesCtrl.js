// Imports
const models = require('../models');
const asyncLib = require('async');
const jwtUtils = require('../utils/jwt.utils');
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();

// Constants
const TITLE_LIMIT = 2;
const CONTENT_LIMIT = 4;
const ITEMS_LIMIT = 50;

// Routes
module.exports = {
    createMessage: function (req, res) {
        // Getting auth header
        const headerAuth = req.headers['authorization'];
        const userId = jwtUtils.getUserId(headerAuth);
        console.log("UserId : " + userId)

        // Params
        const title = entities.encode(req.body.title);
        const content = entities.encode(req.body.content);

        if (title == null || content == null) {
            return res.status(400).json({ 'error': 'missing parameters' });
        }

        if (title.length <= TITLE_LIMIT || content.length <= CONTENT_LIMIT) {
            return res.status(400).json({ 'error': 'invalid parameters' });
        }

        asyncLib.waterfall([
            function (done) {
                models.User.findOne({
                    where: { id: userId }
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
                    console.log("userFound.id : " + userFound.id)
                    models.Message.create({
                        title: title,
                        content: content,
                        likes: 0,
                        UserId: userFound.id
                    })
                        .then(function (newMessage) {
                            done(newMessage);
                        });
                } else {
                    res.status(404).json({ 'error': 'user not found' });
                }
            },
        ], function (newMessage) {
            if (newMessage) {
                return res.status(201).json(newMessage);
            } else {
                return res.status(500).json({ 'error': 'cannot post message' });
            }
        });
    },
    listMessages: function (req, res) {
        const fields = req.query.fields;
        const limit = parseInt(req.query.limit);
        const offset = parseInt(req.query.offset);
        const order = req.query.order;

        if (limit > ITEMS_LIMIT) {
            limit = ITEMS_LIMIT;
        }

        models.Message.findAll({
            order: [(order != null) ? order.split(':') : ['createdAt', 'DESC']],
            attributes: (fields !== '*' && fields != null) ? fields.split(',') : null,
            limit: (!isNaN(limit)) ? limit : null,
            offset: (!isNaN(offset)) ? offset : null,
            include: [{
                model: models.User,
                attributes: ['username']
            }]
        }).then(function (messages) {
            if (messages) {
                res.status(200).json(messages);
                console.log(messages)
            } else {
                res.status(404).json({ "error": "no messages found" });
            }
        }).catch(function (err) {
            console.log(err);
            res.status(500).json({ "error": "invalid fields" });
        });
    },

    deleteMessage: function (req, res) {
        // Getting auth header
        var headerAuth = req.headers['authorization'];
        var userId = 0;
        console.log("req.body.authId : " + req.body.authId);
        console.log("UserId : " + userId)
        if (req.body.authId !== undefined) {
            userId = req.body.authId
        }else {
            userId = jwtUtils.getUserId(headerAuth)
        }


        // var headerAuth = req.headers['authorization'];
        // var userId = jwtUtils.getUserId(headerAuth);
        console.log("messageId : " + req.body.id)
        // console.log("userId : " + jwtUtils.getUserId(headerAuth))

        const messageId = req.body.id
        // Params
        // var title = req.body.title;
        // var content = req.body.content;

        asyncLib.waterfall([
            // function (done) {
            //     models.User.findOne({
            //         where: { id:17 },
            //         where: {isAdmin: 1 }
            //     })
            //         .then(function (message) {
            //             done(null, message);
            //         })
            //         .catch(function (err) {
            //             return res.status(500).json({ 'error': 'unable to verify user' });
            //         });
            // },
            function (done) {
                models.Message.findOne({
                    where: { id: messageId , userId: userId }
                    // where: { userId: 13 }
                })
                    .then(function (message) {
                        done(null, message);
                    })
                    .catch(function (err) {
                        return res.status(500).json({ 'error': 'unable to verify message' });
                    });
            },
            function (message, done) {
                if (message) {
                    models.Message.destroy({
                        where: { id: messageId }  ,
                        // where: { userId: 13 }
                    })
                        .then(function (message) {
                            done(message);
                        });
                } else {
                    res.status(404).json({ 'error': 'message not found' });
                }
            },
        ], function (message) {
                if (message) {
                    return res.status(201).json(message);
            } else {
                return res.status(500).json({ 'error': 'cannot post message' });
            }
        });
    }
}
