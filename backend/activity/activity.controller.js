const { session } = require('passport');
const activityService = require('./activity.service');

exports.getLogs = async ( req, res, next ) => {
    try{
        const logs = await activityService.getLogs(req.user.id, {
            limit : req.query.limit,
            type : req.query.type,
            severity : req.query.severity,
            sessionId : req.query.sessionId
        });

        return res.status(200).json({
            sucess : true,
            logs
        });

    }catch(error){
        next(error);
    }
}