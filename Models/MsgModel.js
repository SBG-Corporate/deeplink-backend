/* eslint-disable camelcase */
const DynamoDatabase = require('./DB/DynamoDatabase')
const Funciones = require('../Helper/funciones')
const { GetFileInfo } = require('../Controllers/FileController')
const { v4: uuidv4 } = require('uuid')

class MsgModel extends DynamoDatabase {
    constructor (_IndiceTabla = 'Msg', _NombreTabla = 'DeepLink_CORE') {
        super(_IndiceTabla, _NombreTabla)
        this.CamposMinimos = ['_id', 'tipo', 'id_user', 'subject', 'msg', 'destinatario', 'likes', 'files', 'comments', 'created', 'edited', 'views', 'slug', 'articleData', 'notificationsData']
        this.CamposEditables = ['subject', 'msg', 'files', 'slug', 'tags', 'articleData', 'notificationsData']
    }

    async RegistraMsg (Data) {
        const TimeNow = Number(Funciones.getTimeStamp())
        const DatosMsg = {
            tipo: Data.tipo,
            id_user: Data.id_user,
            subject: Data.subject ? Data.subject : "",
            msg: Data.msg,
            destinatario: Data.destinatario ? Data.destinatario : null,
            likes: [],
            files: Data.files ? await this.GeneraFiles(Data.files) : [],
            comments: [],
            tags: Data.tags ? Data.tags : [], // por ahora no se usa
            padre: Data.padre ? Data.padre : null, // por ahora no se usa
            nivel: Data.nivel ? Data.nivel : 0, // por ahora no se usa
            estado: 1,
            created: TimeNow,
            edited: TimeNow,
            views: Data.tipo === "directo" ? [Data.id_user] : [],
            slug: Data.slug ? Data.slug : "",
            articleData: {
                isValidated: false,
                category: Data.category,
                contentNews: Data.contentNews,
                title: Data.title,
            },
            notificationsData: {
                isEnabled: false,
                receivers: Data.receivers ? Data.receivers : [],
                openedBy: []
            }
        }
        const NewMsg = await this.create(DatosMsg)
        return NewMsg || null
    }

    async LeeMsg (_id, FULL = false) {
        const Msg = await this.read(_id)
        if (!FULL) return Msg
        if (!Msg) return null
        return Msg
    }

    async RecuperaHijos (PadreId, Borrados = false) {
        const ListaMsgs = await this.readAll()
        return ListaMsgs.filter(element => {
            const isParentMatch = element.padre === PadreId
            const isNotDeleted = Borrados || element.estado === 1
            return isParentMatch && isNotDeleted
        })
    }

    async ActualizaMsg (id, data, Internal = false) {
        const Msg = await this.read(id)
        if (!Msg) return null
        if (Internal) {
            Object.keys(data).forEach(key => {
                Msg[key] = data[key]
            })
        } else {
            this.CamposEditables.forEach(element => {
                Msg[element] = data[element] || Msg[element]
            })
        }
        if (data.files) {
            Msg.files = await this.GeneraFiles(data.files)
        }

        const NewMsg = await this.update(id, Msg)
        return NewMsg || null
    }

    async GeneraFiles (files) {
        const NewFiles = []
        for (const file of files) {
            if (NewFiles.find(element => element.fileId === file)) continue
            const fileData = await GetFileInfo(file)
            if (!fileData) continue
            NewFiles.push({ fileId: fileData.fileId, url: fileData.url })
        }
        return NewFiles
    }

    async BorraMsg (id, real = false) {
        const Msg = await this.read(id)
        if (!Msg) return null
        if (real) {
            const Resp = await this.delete(id)
            return Resp || null
        } else {
            Msg.estado = 0
            const NewMsg = await this.update(id, Msg)
            return NewMsg || null
        }
    }

    async AñadeLike (id, id_user) {
        const Msg = await this.read(id)
        if (!Msg) return null
        if (Msg.likes.find(element => element.id_user === id_user)) return Msg
        Msg.likes.push({ id_user, created: Number(Funciones.getTimeStamp()) })
        const NewMsg = await this.update(id, Msg)
        return NewMsg || null
    }

    async QuitaLike (id, id_user) {
        const Msg = await this.read(id)
        if (!Msg) return null
        Msg.likes = Msg.likes.filter(element => element.id_user !== id_user)
        const NewMsg = await this.update(id, Msg)
        return NewMsg || null
    }


    async AñadeComment (id, id_user, msg) {
        const Msg = await this.read(id)
        if (!Msg) return null
        Msg.comments.push({
            _id: uuidv4(),
            id_user,
            msg,
            created: Number(Funciones.getTimeStamp()),
            likes: [],
            estado: 1,
            subComments: [],
        })
        const NewMsg = await this.update(id, Msg)
        return NewMsg || null
    }

    async AñadeSubComment (msgId, commentId, id_user, msg) {
        const Msg = await this.read(msgId)
        if (!Msg) return null
        Msg.comments.forEach((comment) => {
            if (comment._id === commentId) {
                comment.subComments.push({
                    _id: uuidv4(),
                    id_user,
                    msg,
                    created: Number(Funciones.getTimeStamp()),
                    likes: [],
                    estado: 1,
                })
            }
        })
        const NewMsg = await this.update(msgId, Msg)
        return NewMsg || null
    }

    async QuitaComment (id, id_user, id_comment) {
        const Msg = await this.read(id);
        if (!Msg) return null;
        const commentToDelete = Msg.comments.find(comment => comment._id === id_comment);
        if (!commentToDelete || commentToDelete.id_user !== id_user) {
            return null;
        }
        Msg.comments.forEach((comment) => {
            if (comment._id === id_comment) {
                comment.estado = 0
            }
        })
        const NewMsg = await this.update(id, Msg);
        return NewMsg || null;
    }

    async QuitaSubComment (msgId, commentId, subCommentId, id_user) {
        const Msg = await this.read(msgId);
        if (!Msg) return null;
        const comment = Msg.comments.find(comment => comment._id === commentId);
        if (!comment) return null;
        const subCommentToDelete = comment.subComments.find(subComment => subComment._id === subCommentId);
        if (!subCommentToDelete || subCommentToDelete.id_user !== id_user) {
            return null;
        }
        comment.subComments.forEach((subComment) => {
            if (subComment._id === subCommentId) {
                subComment.estado = 0;
            }
        });
        const NewMsg = await this.update(msgId, Msg);
        return NewMsg || null;
    }

    async AlternaLikeInAComment (msgId, commentId, userId) {
        const Msg = await this.read(msgId)
        if (!Msg) return null
        const comment = Msg.comments.find(comment => comment._id === commentId)
        if (!comment) return null
        const likeIndex = comment.likes.findIndex(like => like.id_user === userId)
        if (likeIndex === -1) {
            comment.likes.push({ id_user: userId, created: Number(Funciones.getTimeStamp()) })
        } else {
            comment.likes.splice(likeIndex, 1)
        }
        const UpdatedMsg = await this.update(msgId, Msg)
        return UpdatedMsg || null
    }

    async AlternaLikeInASubComment (msgId, commentId, subCommentId, userId) {
        const Msg = await this.read(msgId);
        if (!Msg) return null;
        const comment = Msg.comments.find(comment => comment._id === commentId);
        if (!comment) return null;
        const subComment = comment.subComments.find(subComment => subComment._id === subCommentId);
        if (!subComment) return null;
        const likeIndex = subComment.likes.findIndex(like => like.id_user === userId);
        if (likeIndex === -1) {
            subComment.likes.push({ id_user: userId, created: Number(Funciones.getTimeStamp()) });
        } else {
            subComment.likes.splice(likeIndex, 1);
        }
        const UpdatedMsg = await this.update(msgId, Msg);
        return UpdatedMsg || null;
    }

    async IsOwner (msgId, userId) {
        const Msg = await this.read(msgId);
        return (Msg && Msg.id_user === userId)
    }


    async ListaSlugs (FULL = false) {
        const ListaSlugs = {}
        const ListaMsgs = await this.readAll()
        if (ListaMsgs) {
            ListaMsgs.forEach((element) => {
                if (element.slug) {
                    ListaSlugs[element.slug.toLowerCase()] = { _id: element._id }
                }
            })
        }
        return ListaSlugs
    }


    async CheckSlugsInMsg (slug) {
        const ListaSlugs = await this.ListaSlugs()
        const SlugsBuscado = ListaSlugs[slug.toLowerCase()]
        if (SlugsBuscado) {
            return { existe: true, msg: 'The slug is not valid, choose another one' }
        } else {
            return { existe: false }
        }
    }

    async IncrementarViews (msgId, userId) {
        try {
            const Msg = await this.read(msgId)
            if (!Msg) return null
            // Vemos si el usuario ya ha visitado a este mensaje previamente
            if (!Msg.views.includes(userId)) {
                Msg.views.push(userId)
            }
            const updatedMsg = await this.update(msgId, Msg)
            return updatedMsg || null
        } catch (error) {
            throw new Error(`Error incrementing views: ${error.message}`)
        }
    }

    async MarcarComoVistoMsgDirectos (userId, friendId) {
        const ListaMsgs = await this.readAll();
        if (!ListaMsgs) return false;
        try {
            const updatePromises = ListaMsgs.filter(message =>
                message.destinatario === userId && message.id_user === friendId
            ).map(async message => {
                if (!message.views.includes(userId)) {
                    message.views.push(userId);
                    return this.update(message._id, message);
                }
            });
            await Promise.all(updatePromises);
            return true;
        } catch (error) {
            console.error('Error updating messages:', error);
            return false;
        }
    }

    async MarcarComoVistoMsgNotificacion (userId, msgId) {
        const Msg = await this.read(msgId);
        if (!Msg) return null;
        try {
            const isSeen = Msg.notificationsData.openedBy.includes(userId)
            if (!isSeen) {
                Msg.notificationsData.openedBy.push(userId)
            }
            const UpdatedMsg = await this.update(msgId, Msg);
            return UpdatedMsg
        } catch (error) {
            console.error('Error markin as view a notification:', error);
            return false;
        }
    }



    async AlternaLikeInAComment (msgId, commentId, userId) {
        const Msg = await this.read(msgId);
        if (!Msg) return null;
        const comment = Msg.comments.find(comment => comment._id === commentId);
        if (!comment) return null;
        const likeIndex = comment.likes.findIndex(like => like.id_user === userId);
        if (likeIndex === -1) {
            comment.likes.push({ id_user: userId, created: Number(Funciones.getTimeStamp()) });
        } else {
            comment.likes.splice(likeIndex, 1);
        }
        const UpdatedMsg = await this.update(msgId, Msg);
        return UpdatedMsg || null;
    }

    async ObtenerDashboardData (userId, dateFilter) {
        const ListaMsgs = await this.readAll()
        const now = Date.now();
        let startDate;
        switch (dateFilter) {
            case "Today":
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                break;
            case "Last week":
                startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
                break;
            case "Last month":
                startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
                break;
            case "Last year":
                startDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(0);
        }
        const FilterListaMsgs = ListaMsgs.filter(message => message.created >= startDate.getTime());

        let likesInPostsGiven = 0
        let likesInArticlesGiven = 0
        let likesInCommentsGiven = 0
        let totalLikesGiven = 0
        let likesInPostsReceived = 0
        let likesInArticlesReceived = 0
        let likesInCommentsReceived = 0
        let totalLikesReceived = 0
        let commentsInPostsGiven = 0
        let commentsInArticlesGiven = 0
        let totalCommentsGiven = 0
        let commentsInPostsReceived = 0
        let commentsInArticlesReceived = 0
        let totalCommentsReceived = 0
        let viewsInPosts = 0
        let viewsInArticles = 0
        let totalPosts = 0
        let totalArticles = 0

        FilterListaMsgs.forEach((message) => {
            if (message.id_user === userId) {
                if (message.tipo === "noticia") {
                    totalArticles++
                    viewsInArticles += message.views.length
                    likesInArticlesReceived += message.likes.length
                    commentsInArticlesReceived += message.comments.length
                }
                if (message.tipo === "post") {
                    totalPosts++
                    viewsInPosts += message.views.length
                    likesInPostsReceived += message.likes.length
                    commentsInPostsReceived += message.comments.length
                }

                message.likes.forEach((like) => {
                    if (like.id_user === userId) {
                        if (message.tipo === "noticia") { likesInArticlesGiven++ }
                        if (message.tipo === "post") { likesInPostsGiven++ }
                    }
                })
                message.comments.forEach((comment) => {
                    if (comment.id_user === userId) {
                        if (message.tipo === "noticia") { commentsInArticlesGiven++ }
                        if (message.tipo === "post") { commentsInPostsGiven++ }
                        likesInCommentsReceived += comment.likes.length
                    }
                    comment.likes.forEach((like) => {
                        if (like.id_user === userId) { likesInCommentsGiven++ }
                    })
                })
            }
        })

        totalLikesGiven = likesInPostsGiven + likesInArticlesGiven + likesInCommentsGiven
        totalLikesReceived = likesInPostsReceived + likesInArticlesReceived + likesInCommentsReceived
        totalCommentsGiven = commentsInPostsGiven + commentsInArticlesGiven
        totalCommentsReceived = commentsInPostsReceived + commentsInArticlesReceived

        return {
            likesInPostsGiven,
            likesInArticlesGiven,
            likesInCommentsGiven,
            totalLikesGiven,
            likesInPostsReceived,
            likesInArticlesReceived,
            likesInCommentsReceived,
            totalLikesReceived,
            commentsInPostsGiven,
            commentsInArticlesGiven,
            totalCommentsGiven,
            commentsInPostsReceived,
            commentsInArticlesReceived,
            totalCommentsReceived,
            viewsInPosts,
            viewsInArticles,
            totalPosts,
            totalArticles,
        }
    }

    async AlternaValidaArticle (msgId) {
        const Msg = await this.read(msgId)
        if (!Msg) return null
        Msg.articleData.isValidated = !Msg.articleData.isValidated
        const NewMsg = await this.update(msgId, Msg)
        return NewMsg || null
    }

    async AlternaValidaNotification (msgId) {
        const Msg = await this.read(msgId)
        if (!Msg) return null
        Msg.notificationsData.isEnabled = !Msg.notificationsData.isEnabled
        const NewMsg = await this.update(msgId, Msg)
        return NewMsg || null
    }


    async GetDashboardData () {
        const ListaMsgs = await this.readAll();
        if (!ListaMsgs) return false;
        const MsgData = {
            numberOfArticles: 0,
            numberOfPosts: 0,
            numberOfDirect: 0,
            numberOfNotifications: 0,
        }
        ListaMsgs.forEach((msg) => {
            if (msg.tipo === "noticia") { MsgData.numberOfArticles++ }
            if (msg.tipo === "post") { MsgData.numberOfPosts++ }
            if (msg.tipo === "directo") { MsgData.numberOfDirect++ }
            if (msg.tipo === "notificacion") { MsgData.numberOfNotifications++ }
        })
        return MsgData
    }
}

module.exports = MsgModel
