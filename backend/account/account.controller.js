const accountService = require('./account.service');

exports.getSecurity = async ( req, res, next ) => {
    try{
        const { limitEvents } = req.query;
        const data = await accountService.getSecurity(req.user.id, limitEvents);

        res.status(200).json(data);
    }catch(error){
        next(error);
    }
};

exports.changePassword = async ( req, res, next ) => {
    try{
        const result = await accountService.changePassword(
            req.user.id,
            req.user.sessionId,
            req.body,
            {
                ip: req.ip,
                userAgent: req.headers['user-agent']
            }
        );

        res.status(200).json(result);
    }catch(error){
        next(error);
    }
};

exports.getProvider = async ( req, res, next ) => {
    try{
        const provider = await accountService.getProvider(req.user.id);

        res.status(200).json(provider);
    }catch(error){
        next(error);
    }
};

exports.unlinkProvider = async ( req, res, next ) => {
    try{
        const result = await accountService.unlinkProvider(
            req.user.id,
            req.user.sessionId,
            req.params.provider,
            {
                ip: req.ip,
                userAgent: req.headers['user-agent']
            }
        );

        res.status(200).json(result);
    }catch(error){
        next(error);
    }
};

exports.passwordEmpty = async ( req, res, next ) => {
    try{
        const hasPassword = await accountService.passwordEmpty(
            req.user.id
        );

        res.json({ hasPassword });
    }catch(error){
        next(error);
    }
};

exports.setPassword = async ( req, res, next ) => {
    try{
        const result = await accountService.setPassword(
            req.user.id,
            req.user.sessionId,
            req.body,
            {
                ip: req.ip,
                userAgent: req.headers['user-agent']
            }
        );

        res.status(200).json(result);
    }catch(error){
        next(error);
    }
}