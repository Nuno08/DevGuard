const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs : 15 * 60 * 1000, //15 min
    max : 10, //max 10 requests per IP
    message: {
        message: 'Too many login attempts. Try again later.'
    }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

module.exports = {
    apiLimiter,
    loginLimiter
};