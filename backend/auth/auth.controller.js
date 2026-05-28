const authService = require('./auth.service');

exports.register = async ( req, res, next ) => {
    try{
        const result = await authService.register(req.body);
        return res.status(201).json(result);
    }catch(error){
        next(error);
    }
};

exports.login = async ( req, res, next ) => {
    try{
        const requestMeta = {
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        };

        const result = await authService.login(req.body, requestMeta);
        return res.status(200).json(result);
    }catch(error){
        next(error);
    }
};

exports.me = async ( req, res, next ) => {
    try{
        const result = await authService.me(req.user);
        return res.status(200).json(result);
    }catch(error){
        next(error);
    }
};

exports.refresh = async ( req, res, next ) => {
    try{
        const { refreshToken } = req.body;
        const result = await authService.refresh(refreshToken);
        return res.status(200).json(result);
    }catch(error){
        next(error);;
    }
};

exports.logout = async ( req, res, next ) => {
    try{
        const { refreshToken } = req.body;
        const result = await authService.logout(refreshToken);
        return res.status(200).json(result)
    }catch(error){
        next(error);
    }
};

exports.logoutAll = async ( req, res, next ) => {
    try{
        const result = await authService.logoutAll(req.user.id);
        return res.status(200).json(result)
    }catch(error){
        next(error);
    }
};