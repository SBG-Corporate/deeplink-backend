const ErrorSend = require('../Helper/errores')
const UserModel = require('../Models/UserModel')
const UserDB = new UserModel()
const MsgModel = require('../Models/MsgModel')
const MsgDB = new MsgModel()
const ChallengeModel = require('../Models/ChallengeModel')
const ChallengeDB = new ChallengeModel()

async function UserGet (req, res) {
    try {
        const FULL = !!(req.query.full)
        const Usuario = await UserDB.read(req.params._id)
        return Usuario ? res.json(UserDB.Parse(Usuario, FULL)) : ErrorSend(res, 404, 'No se ha encontrado el usuario')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UserGetAll (req, res) {
    try {
        const FULL = !!(req.query.full)
        const Usuarios = await UserDB.readAll()
        return res.json(UserDB.Parse(Usuarios, FULL))
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UserSetEstado (req, res) {
    try {
        const Usuario = await UserDB.ActualizaUsuario(req.params._id, { estado: Number(req.params.estado) }, true)
        return Usuario ? res.json(Usuario) : ErrorSend(res, 404, 'No se ha encontrado el usuario')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UserUpdate (req, res) {
    try {
        const Usuario = await UserDB.ActualizaUsuario(req.params._id, req.body, true)
        return Usuario ? res.json(Usuario) : ErrorSend(res, 404, 'No se ha encontrado el usuario')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UserGetRol (req, res) {
    const Rol = req.params._rol
    const Usuarios = await UserDB.readAll()
    const Roles = { rol: Rol, count: 0, miembros: [] }
    Usuarios.forEach((Usuario) => {
        if (Usuario.rol.includes(Rol)) {
            Roles.miembros.push({ _id: Usuario._id, usuario: Usuario.usuario, alias: Usuario.alias })
            Roles.count++
        }
    })
    return res.json(Roles)
}

async function UserGetAllRol (req, res) {
    const Usuarios = await UserDB.readAll()
    const Roles = {}
    Usuarios.forEach((Usuario) => {
        Usuario.rol.forEach((Rol) => {
            if (!Object.keys(Roles).includes(Rol)) Roles[Rol] = { count: 0, miembros: [] }
            Roles[Rol].miembros.push({ _id: Usuario._id, usuario: Usuario.usuario, alias: Usuario.alias })
            Roles[Rol].count++
        })
    })
    return res.json(Roles)
}

async function UserAddRol (req, res) {
    try {
        const UserId = req.params._id
        const Rol = req.body.rol
        const Resp = await UserDB.AgregaRolUsuario(UserId, Rol)
        if (!Resp) return ErrorSend(res, 400, 'Ya tiene ese rol')
        return res.json(Resp)
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UserDeleteRol (req, res) {
    try {
        const UserId = req.params._id
        const Rol = req.body.rol
        const Resp = await UserDB.EliminaRolUsuario(UserId, Rol)
        if (!Resp) return ErrorSend(res, 400, 'No tiene ese rol')
        return res.json(Resp)
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UserRealDelete (req, res) {
    try {
        const Usuario = await UserDB.BorraUsuarioTotalmente(req.params._id)
        return Usuario ? res.json(Usuario) : ErrorSend(res, 404, 'No se ha encontrado el usuario')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function GetDashboardData (req, res) {
    try {
        const MsgData = await MsgDB.GetDashboardData()
        if (!MsgData) return ErrorSend(res, 400, 'No hay datos de mensajes')

        const UsersData = await UserDB.GetDashboardData()
        if (!UsersData) return ErrorSend(res, 400, 'No hay datos de usuarios')

        const ChallengesData = await ChallengeDB.GetDashboardData()
        if (!UsersData) return ErrorSend(res, 400, 'No hay datos de usuarios')

        const dashboardData = { ...MsgData, ...UsersData, ...ChallengesData }

        return res.json(dashboardData)
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}


module.exports = {
    UserGet,
    UserGetAll,
    UserSetEstado,
    UserUpdate,
    UserGetRol,
    UserGetAllRol,
    UserAddRol,
    UserDeleteRol,
    UserRealDelete,
    GetDashboardData
}
