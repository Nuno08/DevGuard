const express = require('express');
const router = express.Router();

const activityController = require('./activity.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/getLogs', authMiddleware, activityController.getLogs);


module.exports = router;
