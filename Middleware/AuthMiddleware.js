const ErrorSend = require('../Helper/errores')
const DebugSend = require('../Helper/debug')
const ConfigData = require('../Config/config')
const jwt = require('jsonwebtoken')

function GeneraToken (Json, expiresIn) {
    return jwt.sign(Json, ConfigData.ConfigKeys.JwtSecret, { expiresIn })
}

const verifyToken = (req, res, next) => {
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        const token = req.headers.authorization.split(' ')[1]
        jwt.verify(token, ConfigData.ConfigKeys.JwtSecret, (err, decoded) => {
            if (err) {
                return ErrorSend(res, 401, err)
            }
            return next()
        })
    } else {
        return ErrorSend(res, 401, 'No autorizado, no se ha enviado el token')
    }
}

function GetTokenText (req) {
    const TempToken = req.headers.authorization.split(' ')[1] || req
    try {
        return jwt.verify(TempToken, ConfigData.ConfigKeys.JwtSecret)
    } catch (err) {
        DebugSend('Error en GetTokenText:', err)
        return null
    }
}

const onlyAdmin = async (req, res, next) => {
    const UserModel = require('../Models/UserModel')
    const UserDB = new UserModel()
    if (await UserDB.IsAdmin(GetTokenText(req)._id)) {
        return next()
    } else {
        return ErrorSend(res, 401, 'onlyAdmin: El usuario no es Admin')
    }
}

const onlyUserActive = async (req, res, next) => {
    const UserModel = require('../Models/UserModel')
    const UserDB = new UserModel()
    if (await UserDB.IsActive(GetTokenText(req)._id)) {
        return next()
    } else {
        return ErrorSend(res, 401, 'onlyUserActive: El usuario no está activo')
    }
}

function onlyRol (rol) {
    return async function (req, res, next) {
        const UserModel = require('../Models/UserModel')
        const UserDB = new UserModel()
        const UserId = GetTokenText(req)._id
        for (let i = 0; i < rol.length; i++) {
            if (await UserDB.IsRol(UserId, rol[i])) {
                return next()
            }
        }
        return ErrorSend(res, 401, 'verificaRolApp: El usuario no tiene el Rol necesario')
    }
}

const onlyOwnerOrAdminMsg = async (req, res, next) => {
    const UserModel = require('../Models/UserModel')
    const UserDB = new UserModel()
    const MsgModel = require('../Models/MsgModel')
    const MsgDB = new MsgModel()
    const userId = GetTokenText(req)._id
    const msgId = req.params._id
    if (await UserDB.IsAdmin(userId) || await MsgDB.IsOwner(msgId, userId)) {
        return next()
    } else {
        return ErrorSend(res, 401, 'onlyAdmin or onlyOwner: El usuario no es Admin ni owner del mensaje')
    }
}

const onlyOwnerOrAdminGroup = async (req, res, next) => {
    const UserModel = require('../Models/UserModel')
    const UserDB = new UserModel()
    const GrupoModel = require('../Models/GrupoModel')
    const GrupoDB = new GrupoModel()
    const userId = GetTokenText(req)._id
    const groupId = req.params._id
    if (await UserDB.IsAdmin(userId) || await GrupoDB.IsOwner(groupId, userId)) {
        return next()
    } else {
        return ErrorSend(res, 401, 'onlyAdmin or onlyOwner: El usuario no es Admin ni owner del mensaje')
    }
}

module.exports = {
    verifyToken,
    GetTokenText,
    GeneraToken,
    onlyUserActive,
    onlyAdmin,
    onlyRol,
    onlyOwnerOrAdminMsg,
    onlyOwnerOrAdminGroup
}
