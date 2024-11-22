const DynamoDatabase = require('./DB/DynamoDatabase')
const Funciones = require('../Helper/funciones')
const UserModel = require('../Models/UserModel')
const { v4: uuidv4 } = require('uuid')

class GrupoModel extends DynamoDatabase {
    constructor (_IndiceTabla = 'Grupos', _NombreTabla = 'DeepLink_CORE') {
        super(_IndiceTabla, _NombreTabla)
        this.UserDB = new UserModel()
        this.CamposMinimos = ['_id', 'nombre', 'nombreLargo', 'descripcion', 'logo', 'icono', 'estado', 'miembros', 'subgrupos', 'messages', 'userCanWrite', 'category', 'created', 'isPrivate']
        this.CamposEditables = ['nombre', 'nombreLargo', 'descripcion', 'logo', 'icono', 'category']
    }

    Reduce (Objeto) {
        const NewObjeto = {}
        this.CamposMinimos.forEach((element) => {
            switch (element) {
                case 'miembros':
                    // eslint-disable-next-line no-case-declarations
                    const NewMiembros = []
                    for (let i = 0; i < Objeto.miembros.length; i++) {
                        NewMiembros.push(Objeto.miembros[i]._id)
                    }
                    NewObjeto.miembros = NewMiembros
                    break
                case 'subgrupos':
                    NewObjeto.subgrupos = this.ParseSubGrupo(Objeto.subgrupos)
                    break
                default:
                    NewObjeto[element] = Objeto[element]
                    break
            }
        })
        return NewObjeto
    }

    ParseSubGrupo (Objeto, full = false) {
        if (full) return Objeto
        if (Array.isArray(Objeto)) {
            const ListaObjetos = []
            Objeto.forEach((element) => { ListaObjetos.push(element.nombre) })
            return ListaObjetos
        } else {
            return this.ReduceSubGrupo(Objeto.nombre)
        }
    }

    async update (id, Data) {
        Data.edited = new Date().getTime()
        return super.update(id, Data)
    }

    async RegistraGrupo (Nombre, Creador, nombreLargo = '', descripcion = '', logo = '', icono = '', category = "other", userCanWrite = false, isPrivate = false) {
        const TimeNow = Number(Funciones.getTimeStamp())
        const DatosGrupo = {
            nombre: Nombre,
            nombreLargo,
            descripcion,
            logo,
            icono,
            creador: Creador,
            estado: ((descripcion.length > 0) && (nombreLargo.length > 0)) ? 1 : 0,
            created: TimeNow,
            edited: TimeNow,
            subgrupos: [{
                nombre: 'Principal',
                creador: Creador,
                created: TimeNow,
                edited: TimeNow,
                estado: 1
            }],
            miembros: [{
                _id: Creador,
                fechaUnion: TimeNow,
                rolGrupo: ['creador']
            }],
            messages: [],
            userCanWrite,
            category,
            isPrivate,
            privateGroupCode: isPrivate ? uuidv4() : ""
        }
        const NewGrupo = await this.create(DatosGrupo)
        return NewGrupo || false
    }

    async LeeGrupo (_id, FULL = false) {
        const Grupo = await this.read(_id)
        if (!FULL) return Grupo
        for (let i = 0; i < Grupo.miembros.length; i++) {
            const NewMiembro = await this.UserDB.read(Grupo.miembros[i]._id)
            if (NewMiembro) {
                const ParseNewMiembro = this.UserDB.Parse(NewMiembro, false)
                Object.keys(ParseNewMiembro).forEach(key => {
                    Grupo.miembros[i][key] = ParseNewMiembro[key]
                })
            }
        }
        return Grupo
    }

    async ActualizaGrupo (id, data, Internal = false) {
        const Grupo = await this.read(id)
        if (!Grupo) return null
        if (Internal) {
            Object.keys(data).forEach(key => {
                Grupo[key] = data[key]
            })
        } else {
            this.CamposEditables.forEach(element => {
                Grupo[element] = data[element] || Grupo[element]
            })
        }
        if (Grupo.nombreLargo?.length > 0 && Grupo.descripcion?.length > 0 && Grupo.estado === 0) { Grupo.estado = 1 }
        const NewGrupo = await this.update(id, Grupo)
        return NewGrupo || null
    }

    async UnirGrupo (UserId, GrupoId, checkIfIsPrivate) {
        const Grupo = await this.read(GrupoId)
        if (!Grupo) return false
        if (checkIfIsPrivate && Grupo.isPrivate) return false

        for (let i = 0; i < Grupo.miembros.length; i++) {
            if (Grupo.miembros[i]._id === UserId) return false
        }
        const NewMiembro = {
            _id: UserId,
            fechaUnion: Number(Funciones.getTimeStamp()),
            rolGrupo: ['user']
        }
        Grupo.miembros.push(NewMiembro)
        const NewGrupo = await this.update(GrupoId, Grupo)
        return NewGrupo
    }

    async ComprobarGroupCode (groupId, privateGroupCode) {
        const Grupo = await this.read(groupId)
        if (!Grupo) return false
        return Grupo.privateGroupCode === privateGroupCode
    }

    async SalirGrupo (UserId, GrupoId) {
        const Grupo = await this.read(GrupoId)
        if (!Grupo) return false
        for (let i = 0; i < Grupo.miembros.length; i++) {
            if (Grupo.miembros[i]._id === UserId) {
                if ((Grupo.miembros[i].rolGrupo[0] === 'creador') || (Grupo.miembros[i].rolGrupo[0] === 'delete')) return false
                Grupo.miembros.splice(i, 1)
                const NewGrupo = await this.update(GrupoId, Grupo)
                return NewGrupo
            }
        }
        return false
    }

    async LeeSubGrupos (GrupoId) {
        const Grupo = await this.read(GrupoId)
        if (!Grupo) return false
        return Grupo.subgrupos
    }

    async RegistraSubGrupo (GrupoId, UserId, Nombre) {
        const TimeNow = Number(Funciones.getTimeStamp())
        const Grupo = await this.read(GrupoId)
        if (!Grupo) return false
        for (let i = 0; i < Grupo.subgrupos.length; i++) {
            if (Grupo.subgrupos[i].nombre === Nombre) return false
        }
        const NewSubGrupo = {
            nombre: Nombre,
            creador: UserId,
            created: TimeNow,
            edited: TimeNow,
            estado: 1
        }
        Grupo.subgrupos.push(NewSubGrupo)
        const NewGrupo = await this.update(GrupoId, Grupo)
        return NewGrupo.subgrupos
    }

    async EliminaSubGrupo (GrupoId, NombreSubGrupo) {
        const Grupo = await this.read(GrupoId)
        if (!Grupo) return false
        if (NombreSubGrupo.toString().toLowerCase() === 'principal') return false
        for (let i = 0; i < Grupo.subgrupos.length; i++) {
            if (Grupo.subgrupos[i].nombre.toString().toLowerCase() === NombreSubGrupo.toString().toLowerCase()) {
                Grupo.subgrupos.splice(i, 1)
                return !!(await this.update(GrupoId, Grupo))
            }
        }
        return false
    }

    async ActualizaSubGrupo (GrupoId, NombreSubGrupo, NuevosDatos) {
        let Editado = false
        const Grupo = await this.read(GrupoId)
        if (!Grupo) return false
        const TimeNow = Number(Funciones.getTimeStamp())
        for (let i = 0; i < Grupo.subgrupos.length; i++) {
            if (Grupo.subgrupos[i].nombre.toString().toLowerCase() === NombreSubGrupo.toString().toLowerCase()) {
                if ((NuevosDatos.nombre) && (NuevosDatos.nombre.length >= 2) && (NuevosDatos.nombre !== 'Principal') && (NombreSubGrupo.toString().toLowerCase() !== 'Principal')) {
                    const ListaActual = await this.ListaSubGrupos(GrupoId)
                    if (!ListaActual.includes(NuevosDatos.nombre)) {
                        Grupo.subgrupos[i].nombre = NuevosDatos.nombre
                        Editado = true
                    }
                }
                if (NuevosDatos.estado >= 0 || NuevosDatos.estado <= 2) {
                    Grupo.subgrupos[i].estado = parseInt(NuevosDatos.estado)
                    Editado = true
                }
                if (Editado) {
                    Grupo.subgrupos[i].edited = TimeNow
                    return !!(await this.update(GrupoId, Grupo))
                }
                return false
            }
        }
        return false
    }

    async IsMember (UserId, GrupoId) {
        const Grupo = await this.read(GrupoId)
        if (!Grupo) return false
        for (let i = 0; i < Grupo.miembros.length; i++) {
            if (Grupo.miembros[i]._id === UserId) return Grupo.miembros[i].rolGrupo
        }
        return false
    }

    async ListaSubGrupos (GrupoId) {
        const Salida = []
        const Grupo = await this.read(GrupoId)
        if (!Grupo) return false
        for (let i = 0; i < Grupo.subgrupos.length; i++) {
            Salida.push(Grupo.subgrupos[i].nombre)
        }
        return Salida
    }

    async ChangeRol (GrupoId, UserId, Rol = 'delete') {
        const Grupo = await this.read(GrupoId)
        if (!Grupo) return false
        if (Rol === 'creador') return false
        for (let i = 0; i < Grupo.miembros.length; i++) {
            if (Grupo.miembros[i]._id === UserId) {
                if (Grupo.miembros[i].rolGrupo[0] === 'creador') return false
                Grupo.miembros[i].rolGrupo = [Rol]
                return !!(await this.update(GrupoId, Grupo))
            }
        }
        return false
    }

    async LeeRolesGrupo (_id, FULL = false) {
        const ListaRoles = {}
        const Grupo = await this.read(_id)
        if (!Grupo) return false
        for (let i = 0; i < Grupo.miembros.length; i++) {
            const RolActual = Grupo.miembros[i].rolGrupo
            if (Object.keys(ListaRoles).includes(RolActual)) {
                ListaRoles[RolActual].push([])
            }
            delete Grupo.miembros[i].rolGrupo
            if (FULL) {
                const NewMiembro = await this.UserDB.read(Grupo.miembros[i]._id)
                if (NewMiembro) {
                    const ParseNewMiembro = this.UserDB.Parse(NewMiembro, false)
                    Object.keys(ParseNewMiembro).forEach(key => {
                        Grupo.miembros[i][key] = ParseNewMiembro[key]
                    })
                }
            } else {
                delete Grupo.miembros[i].fechaUnion
            }
            ListaRoles[RolActual] = [Grupo.miembros[i]]
        }
        return ListaRoles
    }

    async DaRolGrupoUsuario (GrupoId, UserID, Rol) {
        if (!this.IsMember(UserID, GrupoId)) {
            return false
        }
        return this.ChangeRol(GrupoId, UserID, Rol)
    }

    async ExpulsaUsuarioGrupo (GrupoId, UserID) {
        if (!this.IsMember(UserID, GrupoId)) {
            return false
        }
        return this.ChangeRol(GrupoId, UserID, 'delete')
    }

    async WriteMessageInGroup (userId, groupId, message) {
        const grupo = await this.read(groupId)
        if (!grupo) return undefined
        if (!grupo.userCanWrite) {
            const userInGroup = grupo.miembros.find(member => member._id === userId);
            if (!userInGroup || userInGroup.rolGrupo[0] !== "creador") {
                return undefined;
            }
        }
        const TimeNow = Number(Funciones.getTimeStamp())
        grupo.messages.push({
            _id: uuidv4(),
            id_user: userId,
            message,
            created: TimeNow,
            edited: TimeNow,
            estado: 1,
            likes: [],
        })
        const NewGrupo = await this.update(groupId, grupo)
        return NewGrupo
    }

    async GetUserGroups (userId) {
        const grupos = await this.readAll()
        if (!grupos) return undefined
        const ownedGroups = grupos.filter(grupo => grupo.creador === userId);
        return ownedGroups
    }

    async AlternaUsersCanWrite (groupId) {
        const group = await this.read(groupId)
        if (!group) return null
        group.userCanWrite = !group.userCanWrite
        const NewGroup = await this.update(groupId, group)
        return NewGroup || null
    }

    async IsOwner (groupId, userId) {
        const group = await this.read(groupId);
        return (group && group.creador === userId)
    }

    async AlternaLikeInAMessage (groupId, messageId, userId) {
        const Group = await this.read(groupId)
        if (!Group) return null
        const message = Group.messages.find(message => message._id === messageId)
        if (!message) return null
        const likeIndex = message.likes.findIndex(like => like.id_user === userId)
        if (likeIndex === -1) {
            // Add like
            message.likes.push({ id_user: userId, created: Number(Funciones.getTimeStamp()) })
        } else {
            // Remove like
            message.likes.splice(likeIndex, 1)
        }
        const UpdatedGroup = await this.update(groupId, Group)
        return UpdatedGroup || null
    }

    async AñadeCommentInMessage (groupId, messageId, id_user, msg) {
        const Group = await this.read(groupId)
        if (!Group) return null
        Group.messages.forEach((message) => {
            if (message._id === messageId) {
                message.comments.push({
                    _id: uuidv4(),
                    id_user,
                    msg,
                    created: Number(Funciones.getTimeStamp()),
                    likes: [],
                    estado: 1,
                })
            }
        })
        const NewGroup = await this.update(groupId, Group)
        return NewGroup || null
    }

    async QuitaCommentInMessage (groupId, messageId, commentId, userId) {
        const Group = await this.read(groupId)
        if (!Group) return null;
        const message = Group.messages.find(message => message._id === messageId);
        if (!message) return null;
        const comment = message.comments.find(comment => comment._id === commentId);
        if (!comment || comment.id_user !== userId) {
            return null;
        }
        comment.estado = 0;
        const NewGroup = await this.update(groupId, Group);
        return NewGroup || null;
    }

    async AlternaLikeInMessageComment (groupId, messageId, commentId, userId) {
        const Group = await this.read(groupId);
        if (!Group) return null;
        const message = Group.messages.find(message => message._id === messageId);
        if (!message) return null;
        const comment = message.comments.find(comment => comment._id === commentId);
        if (!comment) return null;
        const likeIndex = comment.likes.findIndex(like => like.id_user === userId);
        if (likeIndex === -1) {
            comment.likes.push({ id_user: userId, created: Number(Funciones.getTimeStamp()) });
        } else {
            comment.likes.splice(likeIndex, 1);
        }
        const UpdatedGroup = await this.update(groupId, Group);
        return UpdatedGroup || null;
    }

    async QuitaMessageInGroup (groupId, messageId, userId) {
        const Group = await this.read(groupId);
        if (!Group) return null;

        const messageToDelete = Group.messages.find(message => message._id === messageId);
        if (!messageToDelete || messageToDelete.id_user !== userId) {
            return null;
        }
        Group.messages.forEach((message) => {
            if (message._id === messageId) {
                message.estado = 0
            }
        })
        const UpdatedGroup = await this.update(groupId, Group);
        return UpdatedGroup || null;
    }
    async QuitaGroup (groupId) {
        const Group = await this.read(groupId);
        if (!Group) return null;
        Group.estado = 0
        const UpdatedGroup = await this.update(groupId, Group);
        return UpdatedGroup || null;
    }
}

module.exports = GrupoModel
