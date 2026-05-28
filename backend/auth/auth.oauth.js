const express = require('express');
const passport = require('../infra/oauth/passport');
const router = express.Router();
const FRONTEND_URL = 'http://127.0.0.1:5500';
const authService = require('../auth/auth.service')

// 🔵 GOOGLE
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${FRONTEND_URL}/frontend/Login/login.html?error=oauth_failed`
    }),
    async (req, res) => {

        if (!req.user) {
            return res.redirect(`${FRONTEND_URL}/frontend/Login/login.html?error=oauth_failed`);
        }

        const result = await authService.oauthLogin(req.user, {
            userAgent: req.headers["user-agent"],
            ip: req.ip
        });

        return res.redirect(
            `${FRONTEND_URL}/frontend/Login/Home.html` +
            `?token=${result.token}` +
            `&refreshToken=${result.refreshToken}` +
            `&username=${encodeURIComponent(result.user.username)}`
        );
    }
);


// 🟣 GITHUB
router.get('/github',
    passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
    passport.authenticate('github', {
        session: false,
        failureRedirect: `${FRONTEND_URL}/frontend/Login/login.html?error=oauth_failed`
    }),
    async (req, res) => {

        if (!req.user) {
            return res.redirect(`${FRONTEND_URL}/frontend/Login/login.html?error=oauth_failed`);
        }

        const result = await authService.oauthLogin(req.user, {
            userAgent: req.headers["user-agent"],
            ip: req.ip
        });

        return res.redirect(
            `${FRONTEND_URL}/frontend/Login/home.html` +
            `?token=${result.token}` +
            `&refreshToken=${result.refreshToken}` +
            `&username=${encodeURIComponent(result.user.username)}`
        );
    }
);


// 🔵 FACEBOOK
router.get('/facebook',
    passport.authenticate('facebook', { scope: ['email', 'public_profile'] })
);

router.get('/facebook/callback',
    passport.authenticate('facebook', {
        session: false,
        failureRedirect: `${FRONTEND_URL}/frontend/Login/login.html?error=oauth_failed`
    }),
    async (req, res) => {

        if (!req.user) {
            return res.redirect(`${FRONTEND_URL}/frontend/Login/login.html?error=oauth_failed`);
        }

        const result = await authService.oauthLogin(req.user, {
            userAgent: req.headers["user-agent"],
            ip: req.ip
        });

        return res.redirect(
            `${FRONTEND_URL}/frontend/Login/Home.html` +
            `?token=${result.token}` +
            `&refreshToken=${result.refreshToken}` +
            `&username=${encodeURIComponent(result.user.username)}`
        );
    }
);

module.exports = router;