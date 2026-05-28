const logger = require('../infra/logger/logger');

module.exports = ( err, req, res, next ) => {
    logger.error(
        `${req.method} ${req.originalUrl} - ${err.stack}`
    );


    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    //JWT errors
    if(err.name === 'TokenExpiredError'){
        statusCode = 401;
        message = 'Token expired';
    }

    if(err.name === 'JsonWebTokenError'){
        statusCode = 401;
        message = 'Invalid token';
    }

    //Validation errors
    if(err.name === 'ValidationError'){
        statusCode = 400;
        message = err.message;
    }

    res.status(statusCode).json({
        message
    });
};