const ErrorSend = require('../Helper/errores')
const MsgModel = require('../Models/MsgModel')
const MsgDB = new MsgModel()
const UserModel = require('../Models/UserModel')
const UserDB = new UserModel()
const { GetTokenText } = require('../Middleware/AuthMiddleware')
const { removeDeletedCommentsFromMsg } = require('../Helper/msgUtils')
const tiposMsg = {
    corto: 'corto',
    post: 'post',
    noticia: 'noticia',
    directo: 'directo',
    notificacion: 'notificacion',
}

function Root (req, res) {
    res.send('Get Msg')
}

async function GetAllMsg (req, res) {
    try {
        const UserId = GetTokenText(req)._id
        const IsAdmin = await UserDB.IsAdmin(UserId)
        const FULL = !!(req.query.full)
        const Msg = await MsgDB.readAll()
        let messagesForAdmin = await MsgDB.Parse(Msg, FULL)

        messagesForAdmin = removeDeletedCommentsFromMsg(messagesForAdmin)

        const messagesForUser = messagesForAdmin.filter((msg) => {
            const isNewsValidated = msg.tipo !== "noticia" ||
                (msg.id_user === UserId ? !msg.articleData.isValidated : msg.articleData.isValidated);

            const isDirectMessageForUser = msg.tipo !== "directo" ||
                msg.id_user === UserId ||
                msg.destinatario === UserId;

            return isNewsValidated && isDirectMessageForUser;
        });

        if (IsAdmin) {
            return res.json(messagesForAdmin)
        } else {
            return res.json(messagesForUser)
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function GetMsg (req, res) {
    try {
        const FULL = !!(req.query.full)
        const Msg = await MsgDB.LeeMsg(req.params._id, FULL)
        if (Msg) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromMsg(Msg)
            return res.json(MsgDB.Parse(MsgWithoutDeletedComments, FULL))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el Mensaje')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function CreateMsg (req, res) {
    try {
        const FULL = !!(req.query.full)
        let TipoMsg = null
        let MsgPadre = null
        let nivel = 0
        // Comprobamos el padre
        if (req.body.padre) {
            MsgPadre = await MsgDB.LeeMsg(req.body.padre)
            if (!MsgPadre) return ErrorSend(res, 400, 'El padre no existe')
            TipoMsg = MsgPadre.tipo // Si se especifica un padre, se crea con el mismo tipo
            nivel = MsgPadre.nivel + 1
        }
        // Comprobamos el tipo
        if (TipoMsg === null) TipoMsg = req.body.tipo || tiposMsg.corto // Si no se especifica el tipo, se crea como corto por DEFECTO
        if (!tiposMsg[TipoMsg]) return ErrorSend(res, 400, 'Tipo de mensaje no válido, solo se aceptan los tipos: ' + Object.keys(tiposMsg).join(', '))
        // Aplicamos restricciones por tipo de mensaje
        if (TipoMsg === tiposMsg.corto) {
            if (req.body.msg.length > 255) { return ErrorSend(res, 400, 'El mensaje corto no puede superar los 255 caracteres') }
        }
        if (TipoMsg === tiposMsg.directo) {
            if (!req.body.destinatario) { return ErrorSend(res, 400, 'El mensaje directo debe especificar un destinatario') }
        }
        if (req.body.tipo === 'post') {
            if (req.body.msg.length > 1000) { return ErrorSend(res, 400, 'El post no puede superar los 1000 caracteres') }
        }
        if (req.body.tipo === 'noticia') {
            // checkeamos que el slug sea único (solo en noticias)
            const CheckSlug = await MsgDB.CheckSlugsInMsg(req.body.slug)
            if (CheckSlug.existe) return ErrorSend(res, 400, { msg: CheckSlug.msg })
            if (req.body.title.length > 100) { return ErrorSend(res, 400, 'El title no puede superar los 100 caracteres') }
            if (req.body.subject.length > 400) { return ErrorSend(res, 400, 'El subject no puede superar los 400 caracteres') }
        }
        if (req.body.tipo === 'notificacion') {
            if (req.body.subject.length > 180) { return ErrorSend(res, 400, 'El title no puede superar los 180 caracteres') }
            if (req.body.msg.length > 2000) { return ErrorSend(res, 400, 'El message no puede superar los 2000 caracteres') }
        }

        const NewData = {
            id_user: GetTokenText(req)._id,
            subject: req.body.subject,
            msg: req.body.msg,
            tipo: TipoMsg,
            destinatario: req.body.destinatario ? req.body.destinatario : null,
            padre: req.body.padre,
            files: req.body.files,
            nivel,
            category: req.body.category ? req.body.category : 'onlyForNews',
            title: req.body.title ? req.body.title : 'onlyForNews',
            contentNews: req.body.contentNews ? req.body.contentNews : [],
            slug: req.body.slug ? req.body.slug : 'onlyForNews',
            tags: req.body.tags ? req.body.tags : [],
            receivers: req.body.receivers ? req.body.receivers : [],
        }
        const NewMsg = await MsgDB.RegistraMsg(NewData)
        return res.status(201).json(MsgDB.Parse(NewMsg, FULL))
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function UpdateMsg (req, res) {
    try {
        const FULL = !!(req.query.full)
        const MsgId = req.params._id
        const Msg = await MsgDB.read(MsgId)

        let data = {}
        if (req.body.tipo === 'noticia') {

            if (req.body.slug) {
                // checkeamos que el slug sea único (solo en noticias)
                const CheckSlug = await MsgDB.CheckSlugsInMsg(req.body.slug)
                if (CheckSlug.existe) return ErrorSend(res, 400, { msg: CheckSlug.msg })
            }

            if (req.body.title.length > 100) { return ErrorSend(res, 400, 'El title no puede superar los 100 caracteres') }
            if (req.body.subject.length > 400) { return ErrorSend(res, 400, 'El subject no puede superar los 400 caracteres') }

            data = {
                subject: req.body.subject,
                files: req.body.files,
                slug: req.body.slug,
                tags: req.body.tags,
                articleData: {
                    isValidated: Msg.articleData.isValidated,
                    category: req.body.category,
                    contentNews: req.body.contentNews,
                    title: req.body.title,
                },
            }

            if (!req.body.slug) {
                delete data.slug;
            }
        } else if (req.body.tipo === 'notificacion') {
            if (req.body.subject.length > 180) { return ErrorSend(res, 400, 'El title no puede superar los 180 caracteres') }
            if (req.body.msg.length > 2000) { return ErrorSend(res, 400, 'El message no puede superar los 2000 caracteres') }

            data = {
                subject: req.body.subject,
                msg: req.body.msg,
                notificationsData: {
                    isEnabled: Msg.notificationsData.isEnabled,
                    receivers: req.body.receivers,
                    openedBy: Msg.notificationsData.openedBy,
                },
            }

        } else {
            data = req.body
        }

        const newMsg = await MsgDB.ActualizaMsg(MsgId, data)

        if (newMsg) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromMsg(newMsg)
            return res.json(MsgDB.Parse(MsgWithoutDeletedComments, FULL))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el Mensaje')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function DeleteMsg (req, res) {
    try {
        const Resp = await MsgDB.BorraMsg(req.params._id, req.body.real ? req.body.real : false)

        if (Resp) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromMsg(Resp)
            return res.json(MsgDB.Parse(MsgWithoutDeletedComments))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el Mensaje')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function AddLike (req, res) {
    try {
        const Resp = await MsgDB.AñadeLike(req.params._id, GetTokenText(req)._id)
        if (Resp) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromMsg(Resp)
            return res.json(MsgDB.Parse(MsgWithoutDeletedComments))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el Mensaje')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function RemoveLike (req, res) {
    try {
        const Resp = await MsgDB.QuitaLike(req.params._id, GetTokenText(req)._id)
        if (Resp) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromMsg(Resp)
            return res.json(MsgDB.Parse(MsgWithoutDeletedComments))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el Mensaje')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function AddComment (req, res) {
    try {
        const Resp = await MsgDB.AñadeComment(req.params._id, GetTokenText(req)._id, req.body.msg)
        if (Resp) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromMsg(Resp)
            return res.json(MsgDB.Parse(MsgWithoutDeletedComments))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el Mensaje')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}


async function RemoveComment (req, res) {
    try {
        const Resp = await MsgDB.QuitaComment(req.params._id, GetTokenText(req)._id, req.body.commentId)
        if (Resp) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromMsg(Resp)
            return res.json(MsgDB.Parse(MsgWithoutDeletedComments))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el msg o el user no es el dueño')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}


async function AddSubComment (req, res) {
    const MsgId = req.params._id
    const CommentId = req.body.commentId
    const UserId = GetTokenText(req)._id
    const Msg = req.body.msg
    try {
        const Resp = await MsgDB.AñadeSubComment(MsgId, CommentId, UserId, Msg)
        if (Resp) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromMsg(Resp)
            return res.json(MsgDB.Parse(MsgWithoutDeletedComments))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el Mensaje')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function RemoveSubComment (req, res) {
    const MsgId = req.params._id
    const CommentId = req.body.commentId
    const SubCommentId = req.body.subCommentId
    const UserId = GetTokenText(req)._id
    try {
        const Resp = await MsgDB.QuitaSubComment(MsgId, CommentId, SubCommentId, UserId)
        if (Resp) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromMsg(Resp)
            return res.json(MsgDB.Parse(MsgWithoutDeletedComments))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el msg o el user no es el dueño')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function ToggleLikeInASubComment (req, res) {
    try {
        const { messageId, CommentId, SubCommentId } = req.body
        const UserId = GetTokenText(req)._id
        const UpdatedMsg = await MsgDB.AlternaLikeInASubComment(messageId, CommentId, SubCommentId, UserId)
        if (UpdatedMsg) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromMsg(UpdatedMsg)
            return res.json(MsgDB.Parse(MsgWithoutDeletedComments))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el mensaje o el comentario')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function ToggleLikeInAComment (req, res) {
    try {
        const { messageId, commentId } = req.body
        const UserId = GetTokenText(req)._id
        const UpdatedMsg = await MsgDB.AlternaLikeInAComment(messageId, commentId, UserId)
        if (UpdatedMsg) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromMsg(UpdatedMsg)
            return res.json(MsgDB.Parse(MsgWithoutDeletedComments))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el mensaje o el comentario')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function IncrementViews (req, res) {
    try {
        const UserId = GetTokenText(req)._id
        const MsgId = req.params._id
        const UpdatedMsg = await MsgDB.IncrementarViews(MsgId, UserId)
        if (UpdatedMsg) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromMsg(UpdatedMsg)
            return res.json(MsgDB.Parse(MsgWithoutDeletedComments))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el mensaje')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function MarkDirectMsgAsViewed (req, res) {
    try {
        const UserId = GetTokenText(req)._id
        const FriendId = req.params.friendId
        const IsUpdated = await MsgDB.MarcarComoVistoMsgDirectos(UserId, FriendId)
        return (IsUpdated) ? res.json({ msg: "Todos los mensajes con este usuario marcados como vistos" }) : ErrorSend(res, 404, 'No se ha encontrado el mensaje')
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function MarkNotificationMsgAsViewed (req, res) {
    try {
        const UserId = GetTokenText(req)._id
        const MsgId = req.params._id
        const UpdatedMsg = await MsgDB.MarcarComoVistoMsgNotificacion(UserId, MsgId)
        if (UpdatedMsg) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromMsg(UpdatedMsg)
            return res.json(MsgDB.Parse(MsgWithoutDeletedComments))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el mensaje')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function GetDashboardData (req, res) {
    try {
        const DateFilter = req.body.dateFilter
        if (DateFilter !== "Today" && DateFilter !== "Last week" && DateFilter !== "Last month" && DateFilter !== "Last year") {
            return ErrorSend(res, 404, 'El parametro de dateFilter no contiene: Today, Last week, Last month, Last year')
        }
        const UserId = GetTokenText(req)._id
        const DashboardData = await MsgDB.ObtenerDashboardData(UserId, DateFilter)
        return res.json(DashboardData)
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function ToggleValidateArticle (req, res) {
    try {
        const MsgId = req.params._id
        const ValidatedArticle = await MsgDB.AlternaValidaArticle(MsgId)
        if (ValidatedArticle) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromMsg(ValidatedArticle)
            return res.json(MsgDB.Parse(MsgWithoutDeletedComments))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el mensaje')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}

async function ToggleValidateNotification (req, res) {
    try {
        const MsgId = req.params._id
        const ValidatedNotification = await MsgDB.AlternaValidaNotification(MsgId)
        if (ValidatedNotification) {
            const MsgWithoutDeletedComments = removeDeletedCommentsFromMsg(Resp)
            return res.json(MsgDB.Parse(MsgWithoutDeletedComments))
        } else {
            return ErrorSend(res, 404, 'No se ha encontrado el mensaje')
        }
    } catch (err) {
        return ErrorSend(res, 500, err.message)
    }
}


module.exports = {
    Root,
    GetAllMsg,
    GetMsg,
    CreateMsg,
    UpdateMsg,
    DeleteMsg,
    AddLike,
    RemoveLike,
    AddComment,
    AddSubComment,
    RemoveComment,
    ToggleLikeInAComment,
    MarkDirectMsgAsViewed,
    MarkNotificationMsgAsViewed,
    IncrementViews,
    GetDashboardData,
    ToggleValidateArticle,
    ToggleValidateNotification,
    RemoveSubComment,
    ToggleLikeInASubComment
}
