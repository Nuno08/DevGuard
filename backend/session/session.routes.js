const express = require('express');
const router = express.Router();

const sessionController = require('./session.controller');
const authMiddleware = require('../middleware/auth.middleware');
const updateLastActive = require('../middleware/sessionActivity.middleware');

router.get('/getSession', authMiddleware, updateLastActive, sessionController.getSession);
router.get('/getSession/active', authMiddleware, sessionController.getSessionActive);
router.delete('/:sessionId/revoke', authMiddleware, sessionController.revokeSessionById);
router.post('/logout-all', authMiddleware, updateLastActive, sessionController.logoutAll);


module.exports = router;