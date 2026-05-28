require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

//Function to generate token with a timelaps of 1h

function generateToken(user){
    return jwt.sign(
        {
            id : user.id,
            email : user.email,
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN,
        }
    );
}

//Validates and decodes JWT token

function validateToken(token){
    return jwt.verify(token, JWT_SECRET);
}

//Extract token to header Authorization

function extractTokenFromHeader(req){
    const authHeader = req.headers.authorization;

    if(!authHeader) return null;

    const [, token] = authHeader.split(" ");
    return token;
}

function generateRefreshToken(user){
    return jwt.sign(
        {
            id : user.id,
        },
        JWT_REFRESH_SECRET,
        {
            expiresIn: JWT_REFRESH_EXPIRES_IN,
        }
    );
}

function validateRefreshToken(token){
    return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = {
    generateToken,
    validateToken,
    extractTokenFromHeader,
    generateRefreshToken,
    validateRefreshToken
};