const ErrorSend = require('../Helper/errores')
const UserModel = require('../Models/UserModel')
const GrupoModel = require('../Models/GrupoModel')
const { GetTokenText } = require('./AuthMiddleware')

async function GetUserRolGrupo (UserId, GrupoId) {
    const GrupoDB = new GrupoModel()
    const Grupos = await GrupoDB.read(GrupoId)
    if (Grupos) {
        for (let i = 0; i < Grupos.miembros.length; i++) {
            if (Grupos.miembros[i]._id === UserId) {
                return Grupos.miembros[i].rolGrupo
            }
        }
    } else {
        return null
    }
}

function onlyRolGrupo (rol) {
    return async function (req, res, next) {
        const GrupoId = req.params._id
        const UserId = GetTokenText(req)._id
        const UserDB = new UserModel()
        if ((await UserDB.IsRol(UserId, 'admin')) || (await UserDB.IsRol(UserId, 'moderador'))) return next()
        const RolesGrupoUsuario = await GetUserRolGrupo(UserId, GrupoId)
        if (!RolesGrupoUsuario) return ErrorSend(res, 401, 'onlyRolGrupo: El usuario no tiene el Rol necesario')
        if (RolesGrupoUsuario.includes('creador')) return next()
        for (let i = 0; i < rol.length; i++) {
            if (RolesGrupoUsuario.includes(rol[i])) return next()
        }
        return ErrorSend(res, 401, 'onlyRolGrupo: El usuario no tiene el Rol necesario en ese grupo')
    }
}

module.exports = {
    onlyRolGrupo
}
