const bcrypt = require('bcrypt');
const repository = require('./auth.repository');
const { generateToken, validateToken, extractTokenFromHeader, generateRefreshToken, validateRefreshToken } = require('../utils/jwt');
const crypto = require('crypto');
const logger = require('../infra/logger/logger');
const axios = require('axios');
const { generateRandomPasswordHash } = require('../utils/helper');
const UAParser = require("ua-parser-js");
const { getCountryByIP } = require('../utils/helper');

const register = async (data) => {
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

    return await repository.register({
        email,
        username : data.username,
        password : hashedPassword 
    });
};

const login = async (data, requestMeta) => {
    logger.info('Loging user');
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
        throw new Error('Invalid credentials');
    }

    //Generate token
    const token = generateToken({
        id: user.id,
        username: user.username
    });

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

    //Generate token
    const refreshToken = generateRefreshToken({
        id: user.id
    });

    // HASH REFRESH TOKEN
    const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

    //OPTIONAL: save refresh token in DB
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

const refresh = async (refreshToken) => {
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
    });

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

    return {
        token: newAccessToken,
        refreshToken: newRefreshToken
    };
};

const logout = async (refreshToken) => {
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
        throw new Error('Invalid refresh token')
    }

    await repository.revokeRefreshToken(tokenHash);
    await repository.revokeSession(storedToken.session_id);

    return { message : "Logged out successfully" };
}

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

    // já existe ligação OAuth
    if (oauth) {
        dbUser = await repository.findById(oauth.user_id);
    }

    // não existe ligação
    else {
        if (email) {
            dbUser = await repository.findByEmail(email);
        }

        if (!dbUser) {
            dbUser = await repository.register({
                email,
                username:
                    username ||
                    (email ? email.split('@')[0] : `user_${provider_id}`),
                password: await generateRandomPasswordHash()
            });
        }

        await repository.createOAuth(
            dbUser.id,
            provider,
            provider_id,
            email
        );
    }

    const token = generateToken({
        id: dbUser.id,
        username: dbUser.username
    });

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

const logoutAll = async (user_id) => {
    logger.info('Logout All  Sessions');

    await repository.revokeAllSession(user_id);

    return { message : "Logged out all successfully" };
}



module.exports = {
    register,
    login,
    me,
    refresh,
    logout,
    oauthLogin,
    logoutAll
};