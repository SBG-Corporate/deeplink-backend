const ErrorSend = require('../Helper/errores')
const UserModel = require('../Models/UserModel')
const UserDB = new UserModel()
const { GetTokenText } = require('../Middleware/AuthMiddleware')

async function UserGet (req, res) {
    try {
        const FULL = !!(req.query.full)
        const UserId = GetTokenText(req)._id
        const Usuario = await UserDB.read(UserId)
        return (Usuario) ? res.json(UserDB.Parse(Usuario, FULL)) : ErrorSend(res, 404, 'No se ha encontrado el usuario')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UserUpdate (req, res) {
    try {
        const FULL = !!(req.query.full)
        const UserId = GetTokenText(req)._id
        if (req.body.alias) {
            const CheckAlias = await UserDB.CheckAliasUsuario(req.body.alias)
            if (CheckAlias.existe) return ErrorSend(res, 400, { msg: 'Alias ya existe', alternativos: CheckAlias.alternativos })
        }

        if (req.body.socialLinks && req.body.socialLinks.instagramLink > 256) { return ErrorSend(res, 400, 'instagramLink puede tener hasta 256 caracteres') }
        if (req.body.socialLinks && req.body.socialLinks.twitterLink > 256) { return ErrorSend(res, 400, 'twitterLink puede tener hasta 256 caracteres') }
        if (req.body.socialLinks && req.body.socialLinks.linkedinLink > 256) { return ErrorSend(res, 400, 'linkedinLink puede tener hasta 256 caracteres') }
        if (req.body.socialLinks && req.body.socialLinks.facebookLink > 256) { return ErrorSend(res, 400, 'facebookLink puede tener hasta 256 caracteres') }
        if (req.body.bioInfo && req.body.bioInfo.website > 256) { return ErrorSend(res, 400, 'website puede tener hasta 256 caracteres') }
        if (req.body.bioInfo && req.body.bioInfo.location > 256) { return ErrorSend(res, 400, 'location puede tener hasta 256 caracteres') }
        if (req.body.bioInfo && req.body.bioInfo.ocupation > 256) { return ErrorSend(res, 400, 'ocupation puede tener hasta 256 caracteres') }
        if (req.body.bioInfo && req.body.bioInfo.biography > 160) { return ErrorSend(res, 400, 'biography puede tener hasta 160 caracteres') }

        const Usuario = await UserDB.ActualizaUsuario(UserId, req.body)

        const UsuarioData = await UserDB.Parse(Usuario, FULL)
        if (!Usuario) { return ErrorSend(res, 404, 'No se ha encontrado el usuario') }

        const followers = await UserDB.ObtenerFollowers(UserId)
        const UsuarioDataExtended = { ...UsuarioData, followers }

        return res.json(UsuarioDataExtended)
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UserDelete (req, res) {
    try {
        const FULL = !!(req.query.full)
        const UserId = GetTokenText(req)._id
        const Usuario = await UserDB.BorraUsuario(UserId)
        return Usuario ? res.json(UserDB.Parse(Usuario, FULL)) : ErrorSend(res, 404, 'No se ha encontrado el usuario')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UserRealDelete (req, res) {
    try {
        const FULL = !!(req.query.full)
        const Usuario = await UserDB.BorraUsuarioTotalmente(req.params._id)
        return Usuario ? res.json(UserDB.Parse(Usuario, FULL)) : ErrorSend(res, 404, 'No se ha encontrado el usuario')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function GetAmigo (req, res) {
    try {
        const FULL = !!(req.query.full)
        const UserId = GetTokenText(req)._id
        return res.json(await UserDB.ListaAmigosUsuario(UserId, FULL))
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UserAddAmigo (req, res) {
    try {
        const UserId = GetTokenText(req)._id
        const AmigoId = req.params._id
        if (UserId === AmigoId) return ErrorSend(res, 400, 'No puedes agregarte como Amigo')
        if (!await UserDB.ExisteUsuario(AmigoId)) return ErrorSend(res, 404, 'No se ha encontrado el usuario Amigo')
        const Resp = await UserDB.AñadeAmigoUsuario(UserId, AmigoId)
        if (!Resp) return ErrorSend(res, 400, 'Ya es amigo')
        return res.json(Resp)
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UserDeleteAmigo (req, res) {
    try {
        const UserId = GetTokenText(req)._id
        const AmigoId = req.params._id
        const Resp = await UserDB.EliminaAmigoUsuario(UserId, AmigoId)
        if (!Resp) return ErrorSend(res, 400, 'No era tu amigo')
        return res.json(Resp)
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UserGetAllAlias (req, res) {
    try {
        const FULL = !!(req.query.full)
        const Resp = await UserDB.ListaAliasUsuario(FULL)
        return res.json(Resp)
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UserCheckAlias (req, res) {
    try {
        const Resp = await UserDB.CheckAliasUsuario(req.params.alias)
        if (Resp.existe) {
            return res.json(Resp)
        } else {
            return ErrorSend(res, 404, Resp)
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UserAddSaldo (req, res) {
    try {
        const Resp = await UserDB.AñadeSaldoUsuario(req.params._id, req.body.saldo)
        if (!Resp) return ErrorSend(res, 404, 'No se ha encontrado el usuario')
        return res.json(Resp)
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function GetUserById (req, res) {
    try {
        const UserId = req.params._id
        const FULL = !!(req.query.full)
        const User = await UserDB.read(UserId)
        if (!User) { return ErrorSend(res, 404, 'No se ha encontrado el usuario') }
        const FilteredUser = UserDB.Parse(User, FULL)
        const Followers = await UserDB.ObtenerFollowers(UserId)
        const UserWithFollowers = { ...FilteredUser, Followers }
        return res.json(UserWithFollowers)
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function GetAllUsersByAdmin (req, res) {
    try {
        const FilteredUsers = await UserDB.GetAllUsersWithoutKeys()
        if (!FilteredUsers) { return ErrorSend(res, 404, 'No se han encontrado usuarios'); }
        return res.json(FilteredUsers);
    } catch (err) {
        return ErrorSend(res, 500, err.message);
    }
}

async function IncrementViewsInUser (req, res) {
    try {
        const CurrentUserId = GetTokenText(req)._id
        const ViewedUserId = req.params._id
        if (CurrentUserId === ViewedUserId) { return ErrorSend(res, 404, 'El mismo usuario no cuenta como visita') }
        const UpdatedUser = await UserDB.IncrementarViews(ViewedUserId, CurrentUserId)
        return (UpdatedUser !== null) ? res.json({ UpdatedUser }) : ErrorSend(res, 404, 'No se ha encontrado el mensaje')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function GetMyUserExtended (req, res) {
    try {
        const FULL = !!(req.query.full)
        const UserId = GetTokenText(req)._id
        const User = await UserDB.read(UserId)
        if (!User) { return ErrorSend(res, 404, 'No se ha encontrado el usuario') }
        const UserData = await UserDB.Parse(User, FULL)
        const Followers = await UserDB.ObtenerFollowers(UserId)
        const UserDataExtended = { ...UserData, Followers }
        return res.json(UserDataExtended)
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function GetUsersByIds (req, res) {
    try {
        const UsersIds = req.body.usersIds;
        const FULL = !!(req.query.full)
        if (!Array.isArray(UsersIds) || UsersIds.length === 0) { return ErrorSend(res, 400, 'Invalid UsersIds array'); }
        const Users = await Promise.all(UsersIds.map(userId => UserDB.read(userId)));
        const FilteredUsers = Users.filter(user => user !== null).map(user => UserDB.Parse(user, FULL));
        if (FilteredUsers.length === 0) {
            return ErrorSend(res, 404, 'No users found for the given IDs');
        }
        return res.json(FilteredUsers);
    } catch (err) {
        return ErrorSend(res, 500, err.message);
    }
}


async function ToggleMsgToFavorites (req, res) {
    try {
        const UserId = GetTokenText(req)._id
        const MsgId = req.params._id
        const UpdatedMsg = await UserDB.AlternaMsgToFavorites(MsgId, UserId)
        return (UpdatedMsg) ? res.json(UpdatedMsg) : ErrorSend(res, 404, 'No se ha encontrado el mensaje')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function CreateNewUserByAdmin (req, res) {
    if (req.body.alias) {
        const CheckAlias = await UserDB.CheckAliasUsuario(req.body.alias)
        if (CheckAlias.existe) return ErrorSend(res, 400, { msg: 'Alias ya existe', alternativos: CheckAlias.alternativos })
    }
    if (req.body.socialLinks && req.body.socialLinks.instagramLink > 256) { return ErrorSend(res, 400, 'instagramLink puede tener hasta 256 caracteres') }
    if (req.body.socialLinks && req.body.socialLinks.twitterLink > 256) { return ErrorSend(res, 400, 'twitterLink puede tener hasta 256 caracteres') }
    if (req.body.socialLinks && req.body.socialLinks.linkedinLink > 256) { return ErrorSend(res, 400, 'linkedinLink puede tener hasta 256 caracteres') }
    if (req.body.socialLinks && req.body.socialLinks.facebookLink > 256) { return ErrorSend(res, 400, 'facebookLink puede tener hasta 256 caracteres') }
    if (req.body.bioInfo && req.body.bioInfo.website > 256) { return ErrorSend(res, 400, 'website puede tener hasta 256 caracteres') }
    if (req.body.bioInfo && req.body.bioInfo.location > 256) { return ErrorSend(res, 400, 'location puede tener hasta 256 caracteres') }
    if (req.body.bioInfo && req.body.bioInfo.ocupation > 256) { return ErrorSend(res, 400, 'ocupation puede tener hasta 256 caracteres') }
    if (req.body.bioInfo && req.body.bioInfo.biography > 160) { return ErrorSend(res, 400, 'biography puede tener hasta 160 caracteres') }
    const NewUser = await UserDB.RegistraUsuario(String(req.body.email).toLowerCase())
    if (NewUser === false) return ErrorSend(res, 500, { error: 'Error al crear usuario' })
    const UpdatedUser = await UserDB.ActualizaUsuario(NewUser._id, req.body)
    return res.status(201).json({ UpdatedUser })
}

async function DeleteUserByAdmin (req, res) {
    try {
        const FULL = !!(req.query.full)
        const UserId = req.params._id
        const Usuario = await UserDB.BorraUsuario(UserId)
        return Usuario ? res.json(UserDB.Parse(Usuario, FULL)) : ErrorSend(res, 404, 'No se ha encontrado el usuario')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UpdateUserByAdmin (req, res) {
    try {
        const FULL = !!(req.query.full)
        const UserId = req.params._id
        if (req.body.alias) {
            const CheckAlias = await UserDB.CheckAliasUsuario(req.body.alias)
            if (CheckAlias.existe) return ErrorSend(res, 400, { msg: 'Alias ya existe', alternativos: CheckAlias.alternativos })
        }
        if (req.body.socialLinks && req.body.socialLinks.instagramLink > 256) { return ErrorSend(res, 400, 'instagramLink puede tener hasta 256 caracteres') }
        if (req.body.socialLinks && req.body.socialLinks.twitterLink > 256) { return ErrorSend(res, 400, 'twitterLink puede tener hasta 256 caracteres') }
        if (req.body.socialLinks && req.body.socialLinks.linkedinLink > 256) { return ErrorSend(res, 400, 'linkedinLink puede tener hasta 256 caracteres') }
        if (req.body.socialLinks && req.body.socialLinks.facebookLink > 256) { return ErrorSend(res, 400, 'facebookLink puede tener hasta 256 caracteres') }
        if (req.body.bioInfo && req.body.bioInfo.website > 256) { return ErrorSend(res, 400, 'website puede tener hasta 256 caracteres') }
        if (req.body.bioInfo && req.body.bioInfo.location > 256) { return ErrorSend(res, 400, 'location puede tener hasta 256 caracteres') }
        if (req.body.bioInfo && req.body.bioInfo.ocupation > 256) { return ErrorSend(res, 400, 'ocupation puede tener hasta 256 caracteres') }
        if (req.body.bioInfo && req.body.bioInfo.biography > 160) { return ErrorSend(res, 400, 'biography puede tener hasta 160 caracteres') }
        const Usuario = await UserDB.ActualizaUsuario(UserId, req.body)
        const UsuarioData = await UserDB.Parse(Usuario, FULL)
        if (!Usuario) { return ErrorSend(res, 404, 'No se ha encontrado el usuario') }
        return res.json(UsuarioData)
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function ToggleUserVerificationByAdmin (req, res) {
    try {
        const UserId = req.params._id
        const UpdatedUser = await UserDB.AlternaUserVerification(UserId)
        return (UpdatedUser) ? res.json(UpdatedUser) : ErrorSend(res, 404, 'No se ha encontrado el usuario')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}


module.exports = {
    UserGet,
    UserUpdate,
    UserDelete,
    UserRealDelete,
    GetAmigo,
    UserAddAmigo,
    UserDeleteAmigo,
    UserGetAllAlias,
    UserCheckAlias,
    UserAddSaldo,
    GetUserById,
    GetAllUsersByAdmin,
    IncrementViewsInUser,
    GetMyUserExtended,
    GetUsersByIds,
    ToggleMsgToFavorites,
    CreateNewUserByAdmin,
    DeleteUserByAdmin,
    UpdateUserByAdmin,
    ToggleUserVerificationByAdmin
}
