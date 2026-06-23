const sessionService = require('./session.service');

exports.getSession = async ( req, res, next ) => {
    try{
        const requestMeta = {
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        };

        const user_id = req.user.id;
        const currentSessionId = req.user.sessionId;
        const sessions = await sessionService.getSession(user_id, requestMeta);
        

        const result = sessions.map(session => ({
            ...session,
            isCurrent: session.id === currentSessionId
        }));

        return res.status(200).json({sessions: result});
    }catch(error){
        next(error);
    }
};

exports.getSessionActive = async ( req, res, next ) => {
    try{
        const requestMeta = {
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        };

        const user_id = req.user.id;
        const currentSessionId = req.user.sessionId;
        const sessions = await sessionService.getSessionActive(user_id, requestMeta);
        

        const result = sessions.map(session => ({
            ...session,
            isCurrent: session.id === currentSessionId
        }));

        const otherSession = result.find(
            session => !session.isCurrent
        );

        return res.status(200).json({sessions: result, otherSession});
    }catch(error){
        next(error);
    }
};

exports.revokeSessionById = async ( req, res, next ) => {
    try{
        const requestMeta = {
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        };

        const user_id = req.user.id;
        const sessionId = req.params.sessionId;

        const result = await sessionService.revokeSessionById(user_id, sessionId, requestMeta);

        return res.status(200).json(result);
    }catch(error){
        next(error)
    }
};

exports.logoutAll = async ( req, res, next ) => {
    try{
        const requestMeta = {
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        };
        const result = await sessionService.logoutAll(req.user.id, requestMeta);
        return res.status(200).json(result)
    }catch(error){
        next(error);
    }
};