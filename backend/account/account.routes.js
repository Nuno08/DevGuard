const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const accountController = require('./account.controller');


router.get('/security', authMiddleware, accountController.getSecurity);
router.post('/change-password', authMiddleware, accountController.changePassword);
router.get('/provider', authMiddleware, accountController.getProvider);
router.delete('/provider/:provider', authMiddleware, accountController.unlinkProvider);
router.get('/passwordEmpty', authMiddleware, accountController.passwordEmpty);
router.post('/setPassword', authMiddleware, accountController.setPassword);

module.exports = router;