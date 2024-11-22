const ErrorSend = require('../Helper/errores')
const GrupoModel = require('../Models/GrupoModel')
const GrupoDB = new GrupoModel()
const { GetTokenText } = require('../Middleware/AuthMiddleware')
const { removeDeletedCommentsFromGroupsMsg } = require('../Helper/groupsUtils')

async function GetAllGrupos (req, res) {
    try {
        const FULL = !!(req.query.full)
        const Grupos = await GrupoDB.readAll()
        if (Grupos) {
            const GroupWithoutDeletedComments = removeDeletedCommentsFromGroupsMsg(Grupos)
            return res.json(GrupoDB.Parse(GroupWithoutDeletedComments, FULL))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el grupo')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function GetGrupo (req, res) {
    try {
        const FULL = !!(req.query.full)
        const Grupo = await GrupoDB.LeeGrupo(req.params._id, FULL)

        if (Grupo) {
            const GroupWithoutDeletedComments = removeDeletedCommentsFromGroupsMsg(Grupo)
            return res.json(GrupoDB.Parse(GroupWithoutDeletedComments, FULL))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el grupo')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UpdateGrupo (req, res) {
    try {
        const FULL = !!(req.query.full)
        if (req.body.nombre) {
            const Grupo = await GrupoDB.searchSpecificValue('nombre', req.body.nombre)
            if (Grupo.length > 0) return ErrorSend(res, 400, 'Un Grupo con ese nombre ya existe')
        }
        const Grupo = await GrupoDB.ActualizaGrupo(req.params._id, req.body)

        if (Grupo) {
            const GroupWithoutDeletedComments = removeDeletedCommentsFromGroupsMsg(Grupo)
            return res.json(GrupoDB.Parse(GroupWithoutDeletedComments, FULL))
        } else {
            ErrorSend(res, 404, 'No se ha encontrado el grupo')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function DeleteGrupo (req, res) {
    try {
        const Resp = await GrupoDB.QuitaGroup(req.params._id)
        if (Resp) {
            const GroupWithoutDeletedComments = removeDeletedCommentsFromGroupsMsg(Resp)
            return res.json(GrupoDB.Parse(GroupWithoutDeletedComments, FULL))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el grupo')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function CreateGrupo (req, res) {
    try {
        const FULL = !!(req.query.full)
        const { Nombre = "", NombreLargo = "", Descripcion = "", Logo = "", Icono = "", Category = "", IsPrivate = false } = req.body

        if (Nombre.length > 160) { return ErrorSend(res, 400, 'El nombre no puede superar los 160 caracteres') }
        if (Descripcion.length > 255) { return ErrorSend(res, 400, 'La descripcion no puede superar los 255 caracteres') }
        if (Logo.length > 255) { return ErrorSend(res, 400, 'El logo no puede superar los 255 caracteres') }

        const UserId = GetTokenText(req)._id
        const Grupo = await GrupoDB.searchSpecificValue('nombre', Nombre)
        if (Grupo.length > 0) return ErrorSend(res, 400, 'Grupo ya existe')
        const NewGrupo = await GrupoDB.RegistraGrupo(Nombre, UserId, NombreLargo, Descripcion, Logo, Icono, Category, IsPrivate)
        return res.status(201).json(GrupoDB.Parse(NewGrupo, FULL))
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function JoinGrupoPublic (req, res) {
    const UserId = GetTokenText(req)._id
    const GroupId = req.params._id
    try {
        if (await GrupoDB.UnirGrupo(UserId, GroupId, true)) {
            return res.json(true)
        } else {
            return ErrorSend(res, 400, 'No existe el grupo o ya estabas en el grupo o es privado')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function JoinGrupoPrivate (req, res) {
    const privateGroupCode = req.body.privateGroupCode
    const UserId = GetTokenText(req)._id
    const GroupId = req.params._id
    try {
        const isGropuCodeCorrect = await GrupoDB.ComprobarGroupCode(GroupId, privateGroupCode)
        if (!isGropuCodeCorrect) {
            return ErrorSend(res, 400, 'El código es incorrecto')
        }

        if (await GrupoDB.UnirGrupo(UserId, GroupId, false)) {
            return res.json(true)
        } else {
            return ErrorSend(res, 400, 'No existe el grupo o ya estabas en el grupo')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function LeaveGrupo (req, res) {
    try {
        const UserId = GetTokenText(req)._id
        if (await GrupoDB.SalirGrupo(UserId, req.params._id)) {
            return res.json(true)
        } else {
            return ErrorSend(res, 400, 'No existe el grupo o no estabas en el grupo')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function GetSubGrupos (req, res) {
    try {
        const FULL = !!(req.query.full)
        const SubGrupos = await GrupoDB.LeeSubGrupos(req.params._id)
        return (SubGrupos) ? res.json(GrupoDB.ParseSubGrupo(SubGrupos, FULL)) : ErrorSend(res, 404, 'No se ha encontrado el grupo')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function AddSubGrupo (req, res) {
    try {
        const SubGrupos = await GrupoDB.RegistraSubGrupo(req.params._id, GetTokenText(req)._id, req.body.nombre)
        return (SubGrupos) ? res.status(201).json(SubGrupos) : ErrorSend(res, 400, 'No se ha creado el SubGrupo')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function DeleteSubGrupo (req, res) {
    try {
        const SubGrupos = await GrupoDB.EliminaSubGrupo(req.params._id, req.params.subgrupo)
        return (SubGrupos) ? res.status(200).json(SubGrupos) : ErrorSend(res, 400, 'No existe el SubGrupo o Grupo')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UpdateSubGrupo (req, res) {
    try {
        const SubGrupos = await GrupoDB.ActualizaSubGrupo(req.params._id, req.params.subgrupo, req.body)
        return (SubGrupos) ? res.status(200).json(SubGrupos) : ErrorSend(res, 400, 'No se ha actualizado el SubGrupo')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function ListRolGrupo (req, res) {
    try {
        const FULL = !!(req.query.full)
        const RolesGrupo = await GrupoDB.LeeRolesGrupo(req.params._id, FULL)
        return (RolesGrupo) ? res.json(RolesGrupo) : ErrorSend(res, 404, 'No se ha encontrado el grupo')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function GiveRolGrupo (req, res) {
    try {
        if (await GrupoDB.DaRolGrupoUsuario(req.params._id, req.params.UserId, req.body.rol)) {
            return res.json(true)
        } else {
            return ErrorSend(res, 400, 'No se ha podido asignar el rol al usuario')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function RemoveRolGrupo (req, res) {
    try {
        if (await GrupoDB.ExpulsaUsuarioGrupo(req.params._id, req.params.UserId)) {
            return res.json(true)
        } else {
            return ErrorSend(res, 400, 'No se ha podido asignar el rol al usuario')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function WriteMessage (req, res) {
    try {
        const UserId = GetTokenText(req)._id
        const GroupId = req.params._id
        const Message = req.body.message
        const FULL = !!(req.query.full)

        const UpdatedGroup = await GrupoDB.WriteMessageInGroup(UserId, GroupId, Message)
        if (UpdatedGroup) {
            const GroupWithoutDeletedComments = removeDeletedCommentsFromGroupsMsg(UpdatedGroup)
            return res.json(GrupoDB.Parse(GroupWithoutDeletedComments, FULL))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el grupo')
        }

    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function DeleteMessage (req, res) {
    const UserId = GetTokenText(req)._id
    const GroupId = req.params._id
    const MessageId = req.body.MessageId
    const FULL = !!(req.query.full)
    try {
        const Resp = await GrupoDB.QuitaMessageInGroup(GroupId, MessageId, UserId)
        if (Resp) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromGroupsMsg(Resp)
            return res.json(GrupoDB.Parse(MsgWithoutDeletedComments, FULL))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el msg o el user no es el dueño')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function GetMyGroups (req, res) {
    try {
        const UserId = GetTokenText(req)._id
        const FULL = !!(req.query.full)

        const Groups = await GrupoDB.GetUserGroups(UserId)
        if (Groups) {
            const GroupWithoutDeletedComments = removeDeletedCommentsFromGroupsMsg(Groups)
            return res.json(GrupoDB.Parse(GroupWithoutDeletedComments, FULL))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el grupo')
        }

    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}


async function ToggleUsersCanWrite (req, res) {
    try {
        const GroupId = req.params._id
        const UpdatedGroup = await GrupoDB.AlternaUsersCanWrite(GroupId)
        const FULL = !!(req.query.full)

        if (UpdatedGroup) {
            const GroupWithoutDeletedComments = removeDeletedCommentsFromGroupsMsg(UpdatedGroup)
            return res.json(GrupoDB.Parse(GroupWithoutDeletedComments, FULL))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el grupo')
        }

    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function AddFieldsInMessages (req, res) {
    try {
        const FULL = !!(req.query.full)
        const UpdatedGroups = await GrupoDB.AddFieldInMessages()

        if (UpdatedGroups) {
            const GroupWithoutDeletedComments = removeDeletedCommentsFromGroupsMsg(UpdatedGroups)
            return res.json(GrupoDB.Parse(GroupWithoutDeletedComments, FULL))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el grupo')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function ToggleLikeInAMessage (req, res) {
    try {
        const { GroupId, MessageId } = req.body
        const UserId = GetTokenText(req)._id
        const FULL = !!(req.query.full)
        const UpdatedGroup = await GrupoDB.AlternaLikeInAMessage(GroupId, MessageId, UserId)
        if (UpdatedGroup) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromGroupsMsg(UpdatedGroup)
            return res.json(GrupoDB.Parse(MsgWithoutDeletedComments, FULL))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el mensaje o el comentario')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function AddCommentInMessage (req, res) {
    const GroupId = req.params._id
    const MessageId = req.body.MessageId
    const UserId = GetTokenText(req)._id
    const Msg = req.body.msg
    const FULL = !!(req.query.full)
    try {
        const Resp = await GrupoDB.AñadeCommentInMessage(GroupId, MessageId, UserId, Msg)
        if (Resp) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromGroupsMsg(Resp)
            return res.json(GrupoDB.Parse(MsgWithoutDeletedComments, FULL))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el Mensaje')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function DeleteCommentInMessage (req, res) {
    const GroupId = req.params._id
    const MessageId = req.body.MessageId
    const commentId = req.body.commentId
    const UserId = GetTokenText(req)._id
    const FULL = !!(req.query.full)
    try {
        const Resp = await GrupoDB.QuitaCommentInMessage(GroupId, MessageId, commentId, UserId)
        if (Resp) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromGroupsMsg(Resp)
            return res.json(GrupoDB.Parse(MsgWithoutDeletedComments, FULL))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el msg o el user no es el dueño')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function ToggleLikeInMessageComment (req, res) {
    const { GroupId, MessageId, commentId } = req.body
    const UserId = GetTokenText(req)._id
    const FULL = !!(req.query.full)
    try {
        const UpdatedGroup = await GrupoDB.AlternaLikeInMessageComment(GroupId, MessageId, commentId, UserId)
        if (UpdatedGroup) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromGroupsMsg(UpdatedGroup)
            return res.json(GrupoDB.Parse(MsgWithoutDeletedComments, FULL))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el mensaje o el comentario')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}



module.exports = {
    GetAllGrupos,
    GetGrupo,
    CreateGrupo,
    UpdateGrupo,
    DeleteGrupo,
    JoinGrupoPublic,
    JoinGrupoPrivate,
    LeaveGrupo,
    GetSubGrupos,
    AddSubGrupo,
    DeleteSubGrupo,
    UpdateSubGrupo,
    ListRolGrupo,
    GiveRolGrupo,
    RemoveRolGrupo,
    WriteMessage,
    DeleteMessage,
    GetMyGroups,
    ToggleUsersCanWrite,
    AddFieldsInMessages,
    ToggleLikeInAMessage,
    AddCommentInMessage,
    DeleteCommentInMessage,
    ToggleLikeInMessageComment
}
