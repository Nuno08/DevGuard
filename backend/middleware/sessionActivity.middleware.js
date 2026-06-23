const db = require('../infra/database/db');

const updateLastActive = async ( req, res, next ) => {
    try{
        if(req.user?.sessionId){
            await db.query(
                `UPDATE sessions SET last_active_at = NOW() WHERE id = ?`,
                [req.user.sessionId]
            );
        }
        next();
    }catch(error){
        next(error);
    }
};

module.exports = updateLastActive;