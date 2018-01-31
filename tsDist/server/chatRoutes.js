"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const access = require("./access");
const expressApp_1 = require("./expressApp");
const authMiddleware_1 = require("./authMiddleware");
expressApp_1.default.get('/chat/messages', authMiddleware_1.requireSession(), (req, res, next) => {
    access.getChatMessages()
        .then((messages) => {
        res.status(200).send(messages);
    })
        .catch(next);
});
expressApp_1.default.post('/chat/messages', authMiddleware_1.requireSession(), (req, res, next) => {
    const body = req.body;
    const user = req.user;
    if (_.isEmpty(body.message)) {
        res.status(400).send('Empty message not accepted');
        return;
    }
    const message = {
        user: user._id,
        message: body.message
    };
    access.createChatMessage(message)
        .then(() => {
        res.sendStatus(201);
    })
        .catch(next);
});
