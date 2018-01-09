'use strict';

const express = require('express');

const app = express();
app.set('trust proxy', 1); // trust first proxy
module.exports = app;
