const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GithubStrategy = require('passport-github2').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const authService = require('../../auth/auth.service');
const logger = require('../logger/logger');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {

    try {
        return done(null, {
            provider: 'google',
            provider_id: profile.id,
            email: profile.emails?.[0]?.value,
            username: profile.displayName,
            accessToken,
            refreshToken
        });
    } catch (error) {
        return done(error, null);
    }
}));

logger.info('Google strategy initialized');


passport.use(new GithubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/auth/github/callback"
},
async (accessToken, refreshToken, profile, done) => {

    let email =
        profile.emails?.[0]?.value ||
        profile._json?.email;

    if (!email) {
        const axios = require('axios');

        const res = await axios.get('https://api.github.com/user/emails', {
            headers: {
                Authorization: `token ${accessToken}`
            }
        });

        const primary = res.data.find(e => e.primary && e.verified);
        email = primary?.email;
    }

    return done(null, {
        provider: 'github',
        provider_id: profile.id,
        email,
        username: profile.username,
        accessToken,
        refreshToken
    });
}));

logger.info('GitHub strategy initialized');

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'email', 'photos']
},
async (accessToken, refreshToken, profile, done) => {

    try {
        return done(null, {
            provider: 'facebook',
            provider_id: profile.id,
            email: profile.emails?.[0]?.value,
            username: profile.displayName,
            accessToken,
            refreshToken
        });
    } catch (error) {
        return done(error, null);
    }
}));


logger.info('Facebook strategy initialized');

module.exports = passport;