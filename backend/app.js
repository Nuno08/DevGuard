const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const errorMiddleware = require('./middleware/error.middleware');
const passport = require('./infra/oauth/passport');

app.use(cors());

//Used to parse to json
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

app.use('/auth', require('./auth/auth.routes'));

app.use('/session', require('./session/session.routes'));

app.use('/activity', require('./activity/activity.routes'));

app.use('/account', require('./account/account.routes'));

app.use(errorMiddleware);

module.exports = app;