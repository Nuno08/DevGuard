const repository = require('./session.repository');
const logger = require('../infra/logger/logger');
const { logActivity } = require('../activity/activity.service');

const getSession = async (user_id, requestMeta) => {
    logger.info('Get Sessions');
    
    if (!user_id) {
        throw new Error('user_id is required!');
    }

    const sessions = await repository.getSession(user_id);

    const session = sessions[0];

    return sessions;
};

const getSessionActive = async (user_id, requestMeta) => {
    logger.info('Get Active Sessions');
    
    if (!user_id) {
        throw new Error('user_id is required!');
    }

    const sessions = await repository.getSessionActive(user_id);

    const session = sessions[0];
    
    return sessions;
};

const revokeSessionById = async (user_id, sessionId, requestMeta) => {
    logger.info('Revoke session');

    if(!user_id || !sessionId){
        throw new Error('user_id and session id are required!');
    }
    const session = await repository.getSessionById(user_id, sessionId);
    
    if(!session || session.user_id !== user_id){
        throw new Error('Session not found');
    }

    const revoke = await repository.revokeSessionById(user_id, sessionId);

    await logActivity(
        {
            user_id,
            session_id: sessionId,
            type: 'REVOKE_SESSION_ID_SUCCESS',
            severity: 'warning'
        },
        {
            ip: requestMeta.ip,
            userAgent: requestMeta.userAgent
        }
    );
    return revoke;
};

const logoutAll = async (user_id, requestMeta) => {
    logger.info('Logout All Sessions');

    const revokeAll = await repository.revokeAllSession(user_id);

    await logActivity(
        {
            user_id,
            session_id: null,
            type: 'LOGOUT_ALL_SUCCESS',
            severity: 'critical',
            metadata: {
                scope: 'all_sessions'
            }
        },
        {
            ip: requestMeta.ip,
            userAgent: requestMeta.userAgent
        }
    );

    return { message : "Logged out all successfully" };
};

module.exports = {
    getSession,
    getSessionActive,
    revokeSessionById,
    logoutAll
};