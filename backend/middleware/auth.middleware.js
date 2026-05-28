const { validateToken, extractTokenFromHeader } = require('../utils/jwt');

module.exports = (req, res, next) => {
    try{
        //Extract token
        const token = extractTokenFromHeader(req);

        if(!token){
            const err = new Error('Access denied. No token provided.');
            err.statusCode = 401;
            throw err;
        }

        //Verify token 
        const decoded = validateToken(token);

        //Save user on request
        req.user = decoded;

        //Continue
        next();
    }catch(error){
        error.statusCode = 401;
        next(error);
    }
};