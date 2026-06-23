const repository = require('./account.repository');
const logger = require('../infra/logger/logger');
const bcrypt = require('bcrypt');
const { logActivity } = require('../activity/activity.service');
const sessionRepository = require('../session/session.repository');
const { generateToken, validateToken, extractTokenFromHeader, generateRefreshToken, validateRefreshToken } = require('../utils/jwt');
const { calculateAccountSecurityScore } = require('../utils/helper');


const getSecurityLevel = (score) => {
    if (score >= 80) {
        return {
            level: 'HIGH',
            icon: '🟢'
        };
    }

    if (score >= 50) {
        return {
            level: 'MEDIUM',
            icon: '🟡'
        };
    }

    return {
        level: 'LOW',
        icon: '🔴'
    };
};


const getSecurity = async (user_id, limitEvents) => {
    logger.info('Get Security');
    const providers = await repository.getProvider(user_id);
    const sessions = await sessionRepository.getSession(user_id);
    const logs = await repository.getSecurityEvents(user_id);
    const user = await repository.findByIdWithPassword(user_id);


    const result = await calculateAccountSecurityScore({
        user,
        providers,
        sessions,
        logs
    });

    const score = result?.score ?? result ?? 0;
    const reasons = result?.reasons ?? [];

    return {
        score,
        level: getSecurityLevel(score),
        providers,
        sessions,
         recentEvents: limitEvents
            ? logs.slice(0, limitEvents)
            : logs,
        reasons
    };
};

const changePassword = async (user_id, session_id, data, requestMeta) => {
    logger.info('Change Password');
    const { currentPassword, newPassword } = data;

    if(!currentPassword || !newPassword){
        throw new Error('Missing required fields');
    }

    if (newPassword.length < 6) {
        throw new Error('Password neddes at least 6 characters');
    }

    const user = await repository.findByIdWithPassword(user_id);

    if(!user){
        throw new Error('User not found');
    }

    // 2. Validate current password
    const isValid = await bcrypt.compare(
        currentPassword,
        user.password
    );

    if(!isValid){
        await logActivity({
            user_id,
            session_id,
            type: 'PASSWORD_CHANGE_FAILED',
            severity: 'warning',
            metadata: {
                    reason: 'INVALID_CURRENT_PASSWORD'
            }
        },
        {
            ip: requestMeta?.ip,
            userAgent: requestMeta?.userAgent
        }
        );

        throw new Error('Invalid current password');
    }

    // 3. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update password
    await repository.updatePassword(user_id, hashedPassword);

    // 5. Revoke sessions
    await sessionRepository.revokeAllSession(user_id);

    // 6. Revoke refresh tokens
    await repository.revokeAllRefreshTokens(user_id);

    // 7. Log success
    await logActivity({
        user_id,
        session_id,
        type: 'PASSWORD_CHANGED',
        severity: 'info'
    },
    {
        ip: requestMeta?.ip,
        userAgent: requestMeta?.userAgent
    }
    );
    
    return { message: 'Password updated successfully' };
};

const getProvider = async (user_id) => {
    logger.info('Get Provider');
    if(!user_id){
        throw new Error('Invalid user');
    }

    const provider = await repository.getProvider(user_id);

    return provider;
};

const unlinkProvider = async (user_id, session_id, provider, requestMeta) => {
    // 1. search providers
    const providers = await repository.getProvider(user_id);

    console.log(providers)
    const normalized = provider.trim().toLowerCase();
    console.log(normalized)

    const exists = providers.find(
        p => p.provider.trim().toLowerCase() === normalized
    );

    if (!exists) {
        throw new Error('Provider not found');
    }

    const hasLocalPassword = await repository.userHasPassword(user_id);
    const oauthCount = providers.length;

    // 2. stop accounts without login
    if (!hasLocalPassword && oauthCount <= 1) {
        throw new Error('Cannot remove last login method');
    }

    // 3. ❗ ACTUAL DELETE (faltava isto)
    await repository.unlinkProvider(user_id, normalized);

    // 4. log
    await logActivity(
        {
            user_id,
            session_id,
            type: 'OAUTH_UNLINKED',
            severity: 'warning',
            metadata: {
                provider: normalized
            }
        },
        requestMeta
    );

    return {
        message: 'Provider unlinked successfully'
    };
};

module.exports = {
    getSecurity,
    changePassword,
    getProvider,
    unlinkProvider
}