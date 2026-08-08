const bcrypt = require('bcrypt');
const repository = require('./auth.repository');
const { generateToken, validateToken, extractTokenFromHeader, generateRefreshToken, validateRefreshToken } = require('../utils/jwt');
const crypto = require('crypto');
const logger = require('../infra/logger/logger');
const axios = require('axios');
const { generateRandomPasswordHash } = require('../utils/helper');
const UAParser = require("ua-parser-js");
const { getCountryByIP, detectLoginSuspicious } = require('../utils/helper');
const { logActivity } = require('../activity/activity.service');

//Register of user
const register = async (data, requestMeta) => {
    logger.info('Creating user');
    //Validate required fields
    if(!data.email || !data.username || !data.password){
        throw new Error('Missing required fields');
    }

    const email = data.email.trim().toLowerCase();
    const username = data.username;

    const existingUser = await repository.findByUsername(username);
    const existingEmail = await repository.findByEmail(email);

    if(existingUser){
        throw new Error('Username already in use.');
    }

    if(existingEmail){
        throw new Error('Email already registred.');
    }


    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await repository.register({
        email,
        username : data.username,
        password : hashedPassword 
    });
    try{
        await logActivity(
            {
                user_id: newUser.id,
                session_id: null,
                type: 'REGISTER_SUCCESS'
            },
            {
                ip: requestMeta.ip,
                userAgent: requestMeta.userAgent
            }
        );
    }catch(error){
        logger.error('Failed to create register log', err);
    }

return newUser;
};

//Login User
const login = async (data, requestMeta) => {
    logger.info('Logging user');
    //Validate required fields
    if(!data.email || !data.password){
        throw new Error('Missing required fields');
    }

    const email = data.email.trim().toLowerCase();

    const user = await repository.findByEmail(email);

    if(!user){
        throw new Error('Invalid credentials');
    }


    //Compare Password
    const isValidPassword = await bcrypt.compare(
        data.password,
        user.password
    );

    if(!isValidPassword){
        await logActivity(
        {
            user_id: user.id,
            session_id: null,
            type: 'LOGIN_FAILED',
            severity: 'warning',
            metadata: {
                    reason: 'INVALID_PASSWORD'
            }
        },
        {
            ip: requestMeta.ip,
            userAgent: requestMeta.userAgent
        }
    );
        throw new Error('Invalid credentials');
    }

    const lastActive = new Date(Date.now());

    const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    const parser = new UAParser(requestMeta.userAgent);

    const browser = parser.getBrowser().name;
    const os = parser.getOS().name;

    const deviceName =
        parser.getDevice().model ||
        parser.getDevice().type ||
        "Desktop";

    const country = await getCountryByIP(requestMeta?.ip);

    const lastSession = await repository.getLastSession(user.id);

     const risk = await detectLoginSuspicious({
        lastSession,
        parsedUA: parser,
        country,
        ip: requestMeta?.ip
    });

    const isSuspicious = risk.score >= 40;

    const session = await repository.createSession(
        user.id,
        deviceName,
        browser,
        os,
        requestMeta.ip,
        country,
        requestMeta.userAgent,
        lastActive,
        expiresAt
    );

    await logActivity(
        {
            user_id: user.id,
            session_id: session.id,
            type: isSuspicious ? 'LOGIN_SUSPICIOUS' : 'LOGIN_SUCCESS',
            severity: risk.score >= 60 ? 'critical' : risk.score >= 40 ? 'warning' : 'info',
            metadata: {
                score: risk.score,
                reasons: risk.reasons
            }
        },
        {
            ip: requestMeta.ip,
            userAgent: requestMeta.userAgent
        }
    );

    //Generate access token
    const token = generateToken(
        {
            id: user.id,
            email: user.email
        },
        session.id
    );

    //Generate refresh token
    const refreshToken = generateRefreshToken({
        id: user.id
    });

    // HASH REFRESH TOKEN
    const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

    //Save refresh token in DB
    await repository.saveRefreshToken(
        user.id,
        session.id,
        tokenHash,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    return {
        token,
        refreshToken,
        session,
        user : {
            id : user.id,
            email : user.email,
            username : user.username
        },
        security: {
            suspicious: isSuspicious,
            reasons: isSuspicious ? risk.reasons : []
        }
    };
};

const me = async (userData) => {
    logger.info('User is user');
    const user = await repository.findById(userData.id);

    if(!user){
        throw new Error('User not found');
    }

    return {
        id : user.id,
        email : user.email,
        username : user.username
    };
};

const refresh = async (refreshToken, requestMeta) => {
    logger.info('Refresh token')
    if(!refreshToken){
        throw new Error('Refresh token missing');
    }

    //Validate JWT
    const decoded = validateRefreshToken(refreshToken);

      // 2. hash token
    const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

    //Verifies if exist in db and is not revoked
    const storedToken = await repository.findRefreshToken(tokenHash);

    if(!storedToken){
        throw new Error('Invalid refresh token');
    }

    if (storedToken.revoked) {
        throw new Error('Refresh token already revoked');
    }

    // 5. Verify expiratin
    if (new Date(storedToken.expires_at) < new Date()) {
        throw new Error('Refresh token expired');
    }

    //ROTATION SAFETY
    if (storedToken.replaced_by_token_id) {
        throw new Error('Refresh token reuse detected');
    }

    // 7. gerar novos tokens
    const newAccessToken = generateToken({
        id: decoded.id
    },
        storedToken.session_id
    );

    const newRefreshToken = generateRefreshToken({
        id: decoded.id
    });

    const newHash = crypto
        .createHash('sha256')
        .update(newRefreshToken)
        .digest('hex');

    // 8. criar novo refresh token na DB
    const newStored = await repository.saveRefreshToken(
        decoded.id,
        storedToken.session_id,
        newHash,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    // 9. revogar antigo + ligar cadeia
    await repository.revokeRefreshToken(
        tokenHash,
        new Date()
    );

    await repository.linkRefreshTokens(
        storedToken.id,
        newStored.id
    );

    await logActivity(
        {
            user_id: decoded.id,
            session_id: storedToken.session_id,
            type: 'TOKEN_REFRESH'
        },
        {
            ip: requestMeta.ip,
            userAgent: requestMeta.userAgent
        }
    );

    return {
        token: newAccessToken,
        refreshToken: newRefreshToken
    };
};

//Logout user
const logout = async (refreshToken, requestMeta) => {
    logger.info('Logout user');
    if(!refreshToken){
        throw new Error('Refresh token missing');
    }

    //Validate JWT
    const decoded = validateRefreshToken(refreshToken);
    
    const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest("hex");

    const storedToken = await repository.findRefreshToken(tokenHash);

    if(!storedToken){
        await logActivity(
        {
            user_id: decoded.id,
            session_id: storedToken.session_id,
            type: 'LOGOUT_FAILED'
        },
        {
            ip: requestMeta.ip,
            userAgent: requestMeta.userAgent
        }
    );
        throw new Error('Invalid refresh token')
    }

    await repository.revokeRefreshToken(tokenHash);
    await repository.revokeSession(storedToken.session_id);

    await logActivity(
        {
            user_id: decoded.id,
            session_id: storedToken.session_id,
            type: 'LOGOUT_SUCCESS'
        },
        {
            ip: requestMeta.ip,
            userAgent: requestMeta.userAgent
        }
    );

    return { message : "Logged out successfully" };
}

//Oauth Login
const oauthLogin = async (user, requestMeta = {}) => {
    logger.info('OAuth login');

    if (!user) {
        throw new Error('OAuth user is undefined');
    }

    const {
        provider,
        provider_id,
        email,
        username,
        accessToken
    } = user;

    if (!provider_id) {
        throw new Error(`${provider} missing provider_id`);
    }

    let dbUser;

    const oauth = await repository.findOAuth(provider, provider_id);

    // exist OAuth connection
    if (oauth) {
        dbUser = await repository.findById(oauth.user_id);
    }

    // doesn't exist
    else {
        if (email) {
            dbUser = await repository.findByEmail(email);
        }

        if (!dbUser) {
            logger.info('OAuth Register');
            dbUser = await repository.register({
                email,
                username:
                    username ||
                    (email ? email.split('@')[0] : `user_${provider_id}`),
                password: await generateRandomPasswordHash()
            });

            await logActivity(
                {
                    user_id: dbUser.id,
                    session_id: null,
                    type: 'OAUTH_REGISTER_SUCCESS'
                },
                {
                    ip: requestMeta.ip,
                    userAgent: requestMeta.userAgent
                }
            );
        }

        await repository.createOAuth(
            dbUser.id,
            provider,
            provider_id,
            email
        );
    }


    const lastActive = new Date(Date.now());

    const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    const parser = new UAParser(requestMeta?.userAgent || "");

    const browser = parser.getBrowser()?.name || null;
    const os = parser.getOS()?.name || null;

    const deviceName =
        parser.getDevice()?.model ||
        parser.getDevice()?.type ||
        "Desktop";

    const country = await getCountryByIP(requestMeta?.ip);

    const session = await repository.createSession(
        dbUser.id,
        deviceName,
        browser,
        os,
        requestMeta?.ip,
        country,
        requestMeta?.userAgent,
        lastActive,
        expiresAt
    );


    await logActivity(
        {
            user_id: dbUser.id,
            session_id: session.id,
            type: 'OAUTH_LOGIN_SUCCESS'
        },
        {
            ip: requestMeta.ip,
            userAgent: requestMeta.userAgent
        }
    );

    const token = generateToken({
        id: dbUser.id,
        username: dbUser.username
    },
    session.id
    );

    const refreshToken = generateRefreshToken({
        id: dbUser.id
    });

    const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

    await repository.saveRefreshToken(
        dbUser.id,
        session.id,
        tokenHash,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    return {
        token,
        refreshToken,
        session,
        user: {
            id: dbUser.id,
            email: dbUser.email,
            username: dbUser.username
        }
    };
};


module.exports = {
    register,
    login,
    me,
    refresh,
    logout,
    oauthLogin
};