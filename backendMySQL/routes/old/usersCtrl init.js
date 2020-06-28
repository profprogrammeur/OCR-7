// Imports
const bcrypt = require('bcrypt');
const jwtUtils = require('../../utils/jwt.utils');
const models = require('../../models');
var asyncLib = require('async');


// Constants
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PASSWORD_REGEX = /^(?=.*\d).{4,8}$/;

// Routes
module.exports = {
    register: function (req, res) {

        // params
        const email = req.body.email;
        const username = req.body.username;
        const password = req.body.password;
        const bio = req.body.bio;

        if (email == null || username == null || password == null) {
            return res.status(400).json({ 'error': 'missing parameters' });
        }

        if (username.length >= 13 || username.length <= 4) {
            return res.status(400).json({ 'error': 'wrong username (must be length 5 - 12)' });
        }

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ 'error': 'email is not valid' });
        }

        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({ 'error': 'password invalid (must length 4 - 8 and include 1 number at least)' });
        }


        models.User.findOne({
            attributes: ['email'],
            where: { email: email }
        })
            .then(function (userFound) {
                if (!userFound) {
                    bcrypt.hash(password, 5, function (err, bcryptedPassword) {
                        const newUser = models.User.create({
                            email: email,
                            username: username,
                            password: bcryptedPassword,
                            bio: bio,
                            isAdmin: 0
                        })
                            .then(function (newUser) {
                                return res.statu(201).json({
                                    'userId': newUser.id
                                })
                            })
                            .catch(function (err) {
                                return res.status(500).json({ 'error': 'cannot add user' });
                            });
                    });
                } else {
                    return res.status(409).json({ 'error': 'user already exist' })
                }

            })
            .catch(function (err) {
                return res.status(500).json({ 'error': 'unable to verify user' })
            });

    },



    login: function (req, res) {

        //Params
        const email = req.body.email;
        const password = req.body.password;
        if (email == null || password == null) {
            return res.status(400).json({ 'error': 'missing parameters' });
        }

        // TODO verify mail regex and password 

        models.User.findOne({
            where: { email: email }
        })
            .then(function (userFound) {
                if (userFound) {

                    bcrypt.compare(password, userFound.password, function (errBycrypt, resBycrypt) {
                        if (resBycrypt) {
                            return res.status(200).json({
                                'userId': userFound.id,
                                'token': jwtUtils.generateTokenForUser(userFound)
                            });
                        } else {
                            return res.status(403).json({ 'error': 'invalid password' });
                        }
                    });
                }
                else {
                    return res.status(404).json({ 'error': 'user not exists in DB' });
                }

            })
            .catch(function (err) {
                return res.status(500).json({ 'error': 'unable to verify user' });
            })

    }
}

