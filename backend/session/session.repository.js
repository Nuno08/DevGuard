const db = require('../infra/database/db');


const getSession = async (user_id) => {
    const [rows] = await db.query(
        'SELECT id, device_name, browser, os, ip_address, country, user_agent, created_at, last_active_at, revoked_at FROM sessions WHERE user_id = ? ORDER BY last_active_at DESC',
        [user_id]
    );
    return rows;
};

const getSessionActive = async (user_id) => {
    const [rows] = await db.query(
        `SELECT id, device_name, browser, os, ip_address, country, user_agent, created_at, last_active_at, revoked_at FROM sessions WHERE user_id = ?
         AND expires_at > NOW() AND revoked = 0 ORDER BY last_active_at DESC`,
        [user_id]
    );
    return rows;
};


const getSessionById = async (user_id, sessionId) => {
    const [rows] = await db.query(
        'SELECT id, user_id, revoked_at FROM sessions  WHERE id = ? AND user_id = ?',
        [sessionId, user_id]
    );
    return rows[0] || null;
};

const revokeSessionById = async (user_id, id) => {
    const [rows] = await db.query(
        'UPDATE sessions SET revoked = 1, revoked_at = NOW() WHERE user_id = ? AND id = ?',
        [user_id, id]
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
    getSession,
    getSessionActive,
    getSessionById,
    revokeSessionById,
    revokeAllSession
}
    
