const repository = require('./activity.repository');
const logger = require('../infra/logger/logger');

const getLogs = async (user_id, options) => {
    logger.info('Get Logs');

    const { limit = 20, offset = 0 } = options;
    const SECURITY_EVENTS = [
        'LOGIN_FAILED',
        'PASSWORD_CHANGED',
        'LOGOUT_ALL',
        'SESSION_REVOKED'
    ];
    
    if(!user_id){
        throw new Error('user_id required');
    }

    if (options.securityOnly) {
        options.types = SECURITY_EVENTS;
    }

    return repository.findByUserId(user_id, {
        limit,
        offset
    });
};

const getSeverity = (score = 0) => {
    if (score >= 60) return 'critical';
    if (score >= 40) return 'warning';
    return 'info';
};

const logActivity = async (data, requestMeta = {}) => {
  const {
    user_id,
    session_id = null,
    type,
    severity = 'info',
    metadata = {}
  } = data;

    const ip_address = requestMeta.ip;
    const user_agent = requestMeta.userAgent;

  return repository.createLog({
    user_id,
    session_id,
    type,
    severity: severity || getSeverity(score),
    ip_address: requestMeta.ip,
    user_agent: requestMeta.userAgent,
    metadata
    });
};

module.exports = {
    getLogs,
    logActivity
};