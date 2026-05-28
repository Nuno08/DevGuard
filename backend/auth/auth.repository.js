const db = require('../infra/database/db');

const findByUsername = async (username) => {
    const [rows] = await db.query(
        "SELECT * FROM users WHERE username = ?",
        [username]
    );
    return rows[0];
};

const findByEmail = async(email) => {
    const [rows] = await db.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
    );
    return rows[0];
};

const register = async ({ email, username, password }) => {
    const [result] = await db.query(
        "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
        [email, username, password]
    );

    return {
        id : result.insertId,
        email,
        username
    };
};

const findById = async (id) => {
    const [rows] = await db.query(
        "SELECT id, email, username FROM users WHERE id = ?",
        [id]
    );
    return rows[0];
}

const saveRefreshToken = async (user_id, session_id, tokenHash, expires_at) => {
    const result = await db.query(
        "INSERT INTO refresh_tokens (user_id, session_id, tokenHash, expires_at) VALUES (?, ?, ?, ?)",
        [user_id, session_id, tokenHash, expires_at]
    );
    return {
        id : result.insertId,
        user_id,
        session_id,
        tokenHash,
        expires_at
    };
};

const findRefreshToken = async (tokenHash) => {
    const  [rows] = await db.query(
        "SELECT * FROM refresh_tokens WHERE tokenHash = ? AND REVOKED = 0",
        [tokenHash]
    );
    return rows[0];
};

const revokeRefreshToken = async (tokenHash) => {
    const [rows] = await db.query(
        "UPDATE refresh_tokens SET revoked = 1, revoked_at = NOW() WHERE tokenHash = ?",
        [tokenHash]
    );
    return rows.affectedRows;
};

const linkRefreshTokens = async (oldId, newId) => {
    await db.query(
        `UPDATE refresh_tokens 
         SET replaced_by_token_id = ?
         WHERE id = ?`,
        [newId, oldId]
    );
};

const findOAuth = async (provider, provider_id) => {
    const [rows] = await db.query(
        "SELECT * FROM oauth_accounts WHERE provider = ? AND provider_id = ?",
        [provider, provider_id]
    );
    return rows[0];
};

const createOAuth = async (user_id,	provider, provider_id, email) => {
    const [result] = await db.query(
        "INSERT INTO oauth_accounts (user_id, provider, provider_id, email) VALUES (?, ?, ?, ?)",
        [user_id, provider, provider_id, email]
    );
    return {
        id : result.insertId,
        user_id,
        provider,
        provider_id, 
        email
    }
};

const createSession = async (user_id, device_name, browser, os, ip_address, country, user_agent, last_active_at, expires_at) => {
    const [result] = await db.query(
        "INSERT INTO sessions (user_id, device_name, browser, os, ip_address, country, user_agent, last_active_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [user_id, device_name, browser, os, ip_address, country, user_agent, last_active_at, expires_at]
    );
    return {
        id : result.insertId,
        user_id,
        device_name,
        browser,
        os,
        ip_address,
        country,
        user_agent,
        last_active_at,
        expires_at
    }
};

const revokeSession = async (sessionId) => {
    const [rows] = await db.query(
        `UPDATE sessions SET revoked = 1, revoked_at = NOW() WHERE id = ?`,
        [sessionId]
    );

    return rows.affectedRows;
};

const revokeAllSession = async (user_id) => {
    const [rows] = await db.query(
        `UPDATE sessions SET revoked = 1, revoked_at = NOW() WHERE user_id = ? AND revoked = 0`,
        [user_id]
    );

    return rows.affectedRows;
};


module.exports = {
    register,
    findByUsername,
    findByEmail,
    findById,
    findRefreshToken,
    saveRefreshToken,
    revokeRefreshToken,
    findOAuth,
    createOAuth,
    createSession,
    revokeSession,
    linkRefreshTokens,
    revokeAllSession
};