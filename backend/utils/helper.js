const crypto = require('crypto');
const bcrypt = require('bcrypt');
const axios = require('axios');
const res = require('express/lib/response');

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
}

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
}

module.exports = {
    generateRandomPasswordHash,
    getCountryByIP,
    isLocalIP
};