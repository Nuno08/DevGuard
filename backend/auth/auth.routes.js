const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { loginLimiter } = require('../middleware/rateLimit.middleware');
const oauthRoutes = require('./auth.oauth');

router.post('/register', loginLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/me', authMiddleware, authController.me);
router.post('/logout', authMiddleware, authController.logout);
router.post('/logout-all', authMiddleware, authController.logoutAll);
router.post('/refresh', authController.refresh);
router.use('/', oauthRoutes);

module.exports = router;