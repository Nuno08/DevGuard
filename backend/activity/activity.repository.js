const db = require('../infra/database/db');

const findByUserId = async (user_id, options = {}) => {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    const [rows] = await db.query(
        `SELECT id, user_id, session_id, type, severity, ip_address, user_agent, metadata, created_at FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [user_id, limit, offset]
    );

    return rows;
};

const countByUserId = async (user_id) => {
    const [rows] = await db.query(
        `SELECT COUNT(*) as total FROM activity_logs WHERE user_id = ?`,
        [user_id]
    );

    return rows[0].total
};

const createLog = async ({user_id, session_id, type, severity, ip_address, user_agent, metadata, created_at = new Date()}) => {
    const [result] = await db.query(
        `INSERT INTO activity_logs (user_id, session_id, type, severity, ip_address, user_agent, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, session_id, type, severity, ip_address, user_agent, JSON.stringify(metadata), created_at]
    );

    return result.insertId;
};

module.exports = {
    findByUserId,
    countByUserId,
    createLog
}