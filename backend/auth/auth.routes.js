const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { loginLimiter } = require('../middleware/rateLimit.middleware');
const oauthRoutes = require('./auth.oauth');
const updateLastActive = require('../middleware/sessionActivity.middleware');

router.post('/register', loginLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/me', authMiddleware, updateLastActive, authController.me);
router.post('/logout', authMiddleware, updateLastActive, authController.logout);
router.post('/refresh', updateLastActive, authController.refresh);
router.use('/', oauthRoutes);

module.exports = router;