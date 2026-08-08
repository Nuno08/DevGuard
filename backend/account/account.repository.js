const db = require('../infra/database/db');


const getSecurityEvents = async (user_id) => {
    const [rows] = await db.query(
        `SELECT  al.id, al.type, al.severity, al.metadata, al.ip_address, al.created_at, s.device_name, s.browser, s.os, s.country, s.last_active_at, s.revoked FROM activity_logs al 
        LEFT JOIN sessions s ON al.session_id = s.id WHERE al.user_id = ? ORDER BY al.created_at DESC LIMIT 50`,
        [user_id]
    );
    return rows;
};

const findByIdWithPassword = async (id) => {
    const [rows] = await db.query(
        "SELECT id, email, username, password FROM users WHERE id = ?",
        [id]
    );
    return rows[0];
}

const updatePassword = async (user_id, password) => {
    const [rows] = await db.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [password, user_id]
    );
    return rows;
};

const revokeAllRefreshTokens = async(user_id) => {
    const [rows] = await db.query(
        'UPDATE refresh_tokens SET revoked = 1, revoked_at = NOW() WHERE user_id = ?',
        [user_id]
    );
    return rows;
};

const getProvider = async (user_id) => {
    const [rows] = await db.query(
        'SELECT id, provider, email, created_at FROM oauth_accounts WHERE user_id = ?',
        [user_id]
    );
    return rows;
};

const userHasPassword = async (user_id) => {
    const [rows] = await db.query(
        `SELECT password FROM users WHERE id = ?`,
        [user_id]
    );

    return !!rows[0]?.password;
};

const unlinkProvider = async (user_id, provider) => {
    await db.query(
        `DELETE FROM oauth_accounts 
         WHERE user_id = ? AND provider = ?`,
        [user_id, provider]
    );
};

const hasPassword = async (id) => {
    const [rows] = await db.query(
        "SELECT password IS NOT NULL AS hasPassword FROM users WHERE id = ?",
        [id]
    );

    return Boolean(rows[0]?.hasPassword);
};

module.exports = {
    getSecurityEvents,
    findByIdWithPassword,
    updatePassword,
    revokeAllRefreshTokens,
    getProvider,
    userHasPassword,
    unlinkProvider,
    hasPassword
}