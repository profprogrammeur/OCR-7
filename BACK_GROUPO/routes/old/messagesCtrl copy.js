// Imports
// Models made with the ORM sequilize
var models = require('../../models');
// library to make waterfalls
var asyncLib = require('async');
// to getUserId
var jwtUtils = require('../../utils/jwt.utils');

// Constants to limit length
const TITLE_LIMIT = 2;
const CONTENT_LIMIT = 4;
const ITEMS_LIMIT = 50;

// Routes
module.exports = {
    createMessage: function (req, res) {
        // Getting auth header
        var headerAuth = req.headers['authorization'];
        console.log("req : "  + req.headers['authorization']);
        var userId = jwtUtils.getUserId(headerAuth);
        console.log("userId: " + userId);

        // Params
        var title = req.body.title;
        var content = req.body.content;
       
        if (title == null || content == null) {
            return res.status(400).json({ 'error': 'missing parameters' });
        }

        if (title.length <= TITLE_LIMIT || content.length <= CONTENT_LIMIT) {
            return res.status(400).json({ 'error': 'invalid parameters' });
        }

        asyncLib.waterfall([
            function (done) {
                console.log(userId)
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
                    console.log("userFound :"+ userFound.id )
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
    //parameters to get from URL :
        // select columns to display
        var fields = req.query.fields;
        // get messages by segmentation
        var limit = parseInt(req.query.limit);
        var offset = parseInt(req.query.offset);
        // display in specific order
        var order = req.query.order;

        if (limit > ITEMS_LIMIT) {
            limit = ITEMS_LIMIT;
        }

        models.Message.findAll({
            order: [(order != null) ? order.split(':') : ['title', 'ASC']],
            attributes: (fields !== '*' && fields != null) ? fields.split(',') : null,
            limit: (!isNaN(limit)) ? limit : null,
            offset: (!isNaN(offset)) ? offset : null,
            // include: [{
            //     model: models.User,
            //     attributes: ['username']
            // }]
        }).then(function (messages) {
            if (messages) {
                res.status(200).json(messages);
            } else {
                res.status(404).json({ "error": "no messages found" });
            }
        }).catch(function (err) {
            console.log(err);
            res.status(500).json({ "error": "invalid fields" });
        });
    }
}