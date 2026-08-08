const crypto = require('crypto');
const bcrypt = require('bcrypt');
const axios = require('axios');
const UAParser = require("ua-parser-js");

//Generate a random password hashed
const generateRandomPasswordHash = async () => {
    const randomPassword = crypto.randomBytes(32).toString('hex');

    return await bcrypt.hash(randomPassword, 10);
};

function isLocalIP(ip){

    if(!ip) return true;

    return(
        ip === "127.0.0.1" ||
        ip === "::1" ||
        ip.startsWith("192.168.") ||
        ip.startsWith("10.") ||
        ip.startsWith("172.")
    );
};

async function getCountryByIP(ip) {

    if(isLocalIP(ip)){
        return "PT";
    }

    try{
        const response = await axios.get(
            `https://ipapi.co/${ip}/country/`
        );

        return response.data || null;
    }catch(err){
        console.error("GeoIP Error:", err.message);

        return null;
    }
};

const detectLoginSuspicious = async ({lastSession, parsedUA, country, ip}) => {
    let score = 0;
    const reasons = [];

    const device =
        parsedUA?.getDevice?.()?.model ||
        parsedUA?.getDevice?.()?.type ||
        "Desktop";

    const browser = parsedUA?.getBrowser?.()?.name || null;

    // COUNTRY CHECK
    if (lastSession?.country && country && lastSession.country !== country) {
        score += 40;
        reasons.push('NEW_COUNTRY');
    }

    // DEVICE CHECK
    if (lastSession?.device_name && lastSession.device_name !== device) {
        score += 30;
        reasons.push('NEW_DEVICE');
    }

    // IP CHECK
    if (lastSession?.ip_address && ip && lastSession.ip_address !== ip) {
        score += 10;
        reasons.push('NEW_IP');
    }

    return {reasons, score};
};

const calculateAccountSecurityScore = ({ user, sessions, providers, logs}) => {
    let score = 100;
    const reasons = [];

    // password
    if (!user.password) {
        score -= 20;
        reasons.push('NO_PASSWORD');
    }

    // providers
    if (providers.length === 1) {
        score -= 10;
        reasons.push('SINGLE_PROVIDER');
    }

    if (providers.length >= 2) {
        score += 5;
    }

    const activeSessions = sessions.filter(
        s => !s.revoked_at
    );

    // sessions
    if (activeSessions.length > 5) {
        score -= 10;
        reasons.push('TOO_MANY_SESSIONS');
    }

    const countries = new Set(sessions.map(s => s.country));

    if (countries.size > 1) {
        score -= 15;
        reasons.push('MULTIPLE_COUNTRIES');
    }

    // logs (last 30 days)
    const last30Days = logs.filter(l =>
        new Date(l.created_at) > Date.now() - 30 * 24 * 60 * 60 * 1000
    );

    const suspicious = last30Days.filter(l => l.type === 'LOGIN_SUSPICIOUS').length;

    if (suspicious > 0) {
        score -= suspicious * 15;
        reasons.push('SUSPICIOUS_LOGINS');
    }

    const failed = last30Days.filter(l => l.type === 'LOGIN_FAILED').length;

    if (failed > 0) {
        score -= failed * 2;
        reasons.push('FAILED_LOGINS');
    }

    return {
        score: Math.max(0, Math.min(100, score)),
        reasons
    };
};

const validatePassword = (password) => {
    const errors = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long.');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter.');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter.');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number.');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character.');
    }

    return errors;
};

module.exports = {
    generateRandomPasswordHash,
    getCountryByIP,
    isLocalIP,
    detectLoginSuspicious,
    calculateAccountSecurityScore,
    validatePassword
};