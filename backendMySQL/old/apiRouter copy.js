// Imports
const express = require('express');
const usersCtrl = require('../routes/usersCtrl');
const messagesCtrl = require('../routes/messagesCtrl');


// Router
exports.router = (function() {
    const apiRouter = express.Router();

    // Users routes
    apiRouter.route('/users/register/').post(usersCtrl.register);
    apiRouter.route('/users/login/').post(usersCtrl.login);
    apiRouter.route('/users/me/').get(usersCtrl.getUserProfile);
    apiRouter.route('/users/me/').put(usersCtrl.updateUserProfile);

    //Messages routes
    apiRouter.route('/messages/new/').post(messagesCtrl.createMessage);
    apiRouter.route('/messages/').get(messagesCtrl.listMessages)




    return apiRouter;

})();