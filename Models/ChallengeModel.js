/* eslint-disable camelcase */
const DynamoDatabase = require('./DB/DynamoDatabase')
const Funciones = require('../Helper/funciones')

class ChallengeModel extends DynamoDatabase {
    constructor (_IndiceTabla = 'Challenges', _NombreTabla = 'DeepLink_CORE') {
        super(_IndiceTabla, _NombreTabla)
        this.CamposMinimos = ['_id', 'nombre', 'descripcion', 'recompensa', 'objetivoDeChallenge', 'slug', 'tipoDeChallenge', 'estado', 'created', 'edited']
        this.CamposEditables = ['nombre', 'descripcion', 'recompensa', 'objetivoDeChallenge', 'slug', 'tipoDeChallenge', 'estado']
    }

    async RegistraChallenge (Data) {
        const TimeNow = Number(Funciones.getTimeStamp())
        const ChallengesCount = await this.CountChallenges()
        const DatosChallenge = {
            nombre: Data.nombre,
            descripcion: Data.descripcion,
            slug: Data.slug,
            recompensa: Data.recompensa,
            creador: Data.creador,
            tipoDeChallenge: Data.tipoDeChallenge,
            objetivoDeChallenge: Data.objetivoDeChallenge,
            estado: 1,
            created: TimeNow,
            edited: TimeNow,
            isEnabled: true,
            order: ChallengesCount + 1
        }
        const NewChallenge = await this.create(DatosChallenge)
        return NewChallenge || null
    }

    async CountChallenges () {
        const ListaChallenges = await this.readAll()
        return ListaChallenges ? ListaChallenges.length : 1
    }

    async GetAll (Usuario) {
        const Challenges = await this.readAll()
        if (!Challenges || Challenges.length === 0) {
            return null
        }

        const filteredChallenges = Challenges
            .filter(challenge => Usuario.rol.includes("admin") || challenge.isEnabled === true)
            .filter(challenge => challenge.estado === 1)
            .map(challenge => ({
                nombre: challenge.nombre,
                descripcion: challenge.descripcion,
                tipoDeChallenge: challenge.tipoDeChallenge,
                objetivoDeChallenge: challenge.objetivoDeChallenge,
                recompensa: challenge.recompensa,
                slug: challenge.slug,
                creador: Usuario.rol.includes("admin") ? challenge.creador : "",
                _id: challenge._id,
                isEnabled: challenge.isEnabled,
                order: challenge.order
            })).
            sort((a, b) => a.order - b.order);

        return filteredChallenges
    }

    async ActualizaChallenge (id, data, Internal = false) {
        const Challenge = await this.read(id)
        if (!Challenge) return null
        const CurrentOrder = Challenge.order;
        const NewOrder = data.order;
        if (Internal) {
            Object.keys(data).forEach(key => {
                Challenge[key] = data[key]
            })
        } else {
            this.CamposEditables.forEach(element => {
                Challenge[element] = data[element] || Challenge[element]
            })
        }

        const AllChallenges = await this.readAll();

        if (NewOrder !== undefined && NewOrder !== CurrentOrder) {
            const otherChallenges = AllChallenges.filter(ch => ch._id !== id).sort((a, b) => a.order - b.order);
            otherChallenges.forEach(ch => {
                if (NewOrder < CurrentOrder && ch.order >= NewOrder && ch.order < CurrentOrder) {
                    ch.order++;
                } else if (NewOrder > CurrentOrder && ch.order <= NewOrder && ch.order > CurrentOrder) {
                    ch.order--;
                }
            });
            for (const ch of otherChallenges) {
                await this.update(ch._id, ch);
            }
        }

        if (NewOrder > AllChallenges.length) {
            Challenge.order = AllChallenges.length;
        } else {
            Challenge.order = NewOrder;
        }

        const NewChallenge = await this.update(id, Challenge)
        return NewChallenge || null
    }

    async BorraChallenge (id) {
        const Challenge = await this.read(id);
        if (!Challenge) return null;
        const CurrentOrder = Challenge.order;
        Challenge.estado = 0;
        Challenge.order = -1;
        const NewChallenge = await this.update(id, Challenge);
        if (NewChallenge) {
            const AllChallenges = await this.readAll();
            const remainingChallenges = AllChallenges.filter(ch => ch.estado !== 0).sort((a, b) => a.order - b.order);
            remainingChallenges.forEach(ch => {
                if (ch.order > CurrentOrder) {
                    ch.order--;
                }
            });
            for (const ch of remainingChallenges) {
                await this.update(ch._id, ch);
            }
        }
        return NewChallenge || null;
    }


    async CambiaRecompensa (id, Recompensa) {
        const Challenge = await this.read(id)
        if (!Challenge) return null
        Challenge.recompensa = Recompensa
        const NewChallenge = await this.update(id, Challenge)
        return NewChallenge || null
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


    async CheckSlugsInChallenges (slug) {
        const ListaSlugs = await this.ListaSlugs()
        const SlugsBuscado = ListaSlugs[slug.toLowerCase()]
        if (SlugsBuscado) {
            return { existe: true, msg: 'The slug is not valid, choose another one' }
        } else {
            return { existe: false }
        }
    }

    async GetGivenLikesInMsg (Usuario, Mensajes, MensajeType) {
        let likesInMsg = 0
        Mensajes.forEach((mensaje) => {
            if (mensaje.tipo === MensajeType) {
                mensaje.likes.forEach((like) => {
                    if (like.id_user === Usuario._id) { likesInMsg++ }
                })
            }
        })
        return likesInMsg
    }

    async GetGivenLikesInMsgComments (Usuario, Mensajes) {
        let likesInMsg = 0
        Mensajes.forEach((mensaje) => {
            if (mensaje.tipo === "noticia" || mensaje.tipo === "post") {
                mensaje.comments.forEach((comment) => {
                    comment.likes.forEach((like) => {
                        if (like.id_user === Usuario._id) { likesInMsg++ }
                    })
                })
            }
        })
        return likesInMsg
    }

    async GetReceivedLikesInMsg (Usuario, Mensajes, MensajeType) {
        let likesInMsg = 0
        Mensajes.forEach((mensaje) => {
            if (mensaje.tipo === MensajeType) {
                if (mensaje.id_user === Usuario._id) {
                    likesInMsg += mensaje.likes.length
                }
            }
        })
        return likesInMsg
    }

    async GetReceivedLikesInMsgComments (Usuario, Mensajes) {
        let likesInMsg = 0
        Mensajes.forEach((mensaje) => {
            if (mensaje.tipo === "noticia" || mensaje.tipo === "post") {
                if (mensaje.id_user === Usuario._id) {
                    likesInMsg += mensaje.comments.length
                }
            }
        })
        return likesInMsg
    }

    async GetGivenCommentsInMsg (Usuario, Mensajes, MensajeType) {
        let commentsInMsg = 0
        Mensajes.forEach((mensaje) => {
            if (mensaje.tipo === MensajeType) {
                mensaje.comments.forEach((comment) => {
                    if (comment.id_user === Usuario._id) { commentsInMsg++ }
                })
            }
        })
        return commentsInMsg
    }

    async GetReceivedCommentsInMsg (Usuario, Mensajes, MensajeType) {
        let commentsInMsg = 0
        Mensajes.forEach((mensaje) => {
            if (mensaje.tipo === MensajeType) {
                if (mensaje.id_user === Usuario._id) {
                    commentsInMsg += mensaje.comments.length
                }
            }
        })
        return commentsInMsg
    }

    async GetReceivedViewsInMsg (Usuario, Mensajes, MensajeType) {
        let commentsInMsg = 0
        Mensajes.forEach((mensaje) => {
            if (mensaje.tipo === MensajeType) {
                if (mensaje.id_user === Usuario._id) {
                    commentsInMsg += mensaje.views.length
                }
            }
        })
        return commentsInMsg
    }

    async GetFollowerUsers (Usuario, Usuarios) {
        let follower = 0
        Usuarios.forEach((user) => {
            user.amigos.forEach((amigo) => {
                if (amigo.id_user === Usuario._id) {
                    follower++
                }
            })
        })
        return follower
    }

    async GetTotalMsgOwnedOfAType (Usuario, Mensajes, MensajeType) {
        let ownedMsgs = 0
        Mensajes.forEach((mensaje) => {
            if (mensaje.tipo === MensajeType) {
                if (mensaje.id_user === Usuario._id) {
                    ownedMsgs++
                }
            }
        })
        return ownedMsgs
    }

    async GetDashboardData () {
        const ListaChallenges = await this.readAll()
        if (!ListaChallenges) return false;
        const ChallengesData = {
            numberOfChallenges: 0,
        }
        ChallengesData.numberOfChallenges = ListaChallenges.length
        return ChallengesData
    }


    async AlternaEnable (challengeId) {
        const Challenge = await this.read(challengeId)
        if (!Challenge) return null
        Challenge.isEnabled = !Challenge.isEnabled
        const NewChallenge = await this.update(challengeId, Challenge)
        return NewChallenge || null
    }
}

module.exports = ChallengeModel
