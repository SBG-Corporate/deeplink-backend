const DynamoDatabase = require('./DB/DynamoDatabase')
const Funciones = require('../Helper/funciones')
const ConfigData = require('../Config/config')
const CryptoUtils = require('../Helper/CryptoUtils')
const PassVaultModel = require('../Models/PassVaultModel')

class UserModel extends DynamoDatabase {
    constructor (_IndiceTabla = 'Users', _NombreTabla = 'DeepLink_CORE') {
        super(_IndiceTabla, _NombreTabla)
        this.PassVault = new PassVaultModel()
        this.CamposMinimos = ['_id', 'usuario', 'alias', 'nombre', 'amigos', 'fotoPerfil', 'views', 'socialLinks', 'bioInfo', 'nivel', 'isVerified']
        this.CamposEditables = ['usuario', 'nombre', 'alias', 'fotoPerfil', 'socialLinks', 'bioInfo', 'estado']
    }

    async update (id, Data) {
        Data.edited = new Date().getTime()
        return super.update(id, Data)
    }

    async RegistraUsuario (usuario) {
        const TimeNow = Number(Funciones.getTimeStamp())
        const { publicKeyPEM, privateKeyPEM } = CryptoUtils.GeneraParClaves()
        const DatosUsuario = {
            usuario,
            alias: '',
            nombre: '',
            amigos: [],
            publicKeyPEM,
            rol: (ConfigData.entorno === 'test') || (usuario.toLowerCase() === 'djsanz@gmail.com') ? ['admin', 'user'] : ['user'],
            created: TimeNow,
            edited: TimeNow,
            lastLogin: TimeNow,
            estado: 0,
            saldo: 0,
            fotoPerfil: 'https://deeplink-uploads.s3.eu-west-3.amazonaws.com/public/userProfile.png',
            challengesCompletados: [],
            nivel: 0,
            views: [],
            socialLinks: { instagramLink: "", twitterLink: "", linkedinLink: "", facebookLink: "" },
            bioInfo: { website: "", location: "", ocupation: "", biography: "" },
            isVerified: false,
            favoriteArticles: [],
        }
        const NewUser = await this.create(DatosUsuario)
        if (NewUser) {
            if (await this.PassVault.GuardaClavePrivada(NewUser._id, privateKeyPEM)) {
                return NewUser
            } else {
                return await this.delete(NewUser._id)
            }
        } else {
            return false
        }
    }

    async BorraUsuario (id) {
        return await this.ActualizaUsuario(id, { estado: -1 })
    }

    async BorraUsuarioTotalmente (id) {
        if (await this.delete(id) === 1) {
            await this.PassVault.delete(id)
            return true
        } else {
            return false
        }
    }

    async ExisteUsuario (id) {
        const User = await this.read(id)
        return !!User
    }

    async ActualizaUsuario (id, data, Internal = false) {
        const User = await this.read(id)
        if (!User) return null
        if (Internal) {
            Object.keys(data).forEach(key => {
                User[key] = data[key]
            })
        } else {
            this.CamposEditables.forEach(element => {
                User[element] = data[element] || User[element]
            })
        }
        if (User.nombre && User.nombre.length > 0 && User.estado === 0) { User.estado = 1 }
        const NewUser = await this.update(id, User)
        return NewUser || null
    }

    async AñadeSaldoUsuario (id, saldo) {
        const User = await this.read(id)
        if (!User) return null
        if (!User.saldo) {
            User.saldo = saldo
        } else {
            User.saldo += saldo
        }
        const NewUser = await this.update(id, User)
        return NewUser || null
    }

    async AñadeAmigoUsuario (UserId, AmigoId) {
        const User = await this.read(UserId)
        if (!User) return null
        if (User.amigos.includes(AmigoId)) return false
        User.amigos.push(AmigoId)
        const NewUser = await this.update(UserId, User)
        return NewUser || null
    }

    async EliminaAmigoUsuario (UserId, AmigoId) {
        const User = await this.read(UserId)
        if (!User) return null
        if (User.amigos.includes(AmigoId)) {
            User.amigos = User.amigos.filter((Amigo) => Amigo !== AmigoId)
            const NewUser = await this.update(UserId, User)
            return NewUser || null
        } else {
            return false
        }
    }

    async AgregaRolUsuario (UserId, Rol) {
        const User = await this.read(UserId)
        if (!User) return null
        if (User.rol.includes(Rol)) return false
        User.rol.push(Rol)
        const NewUser = await this.update(UserId, User)
        return NewUser || null
    }

    async EliminaRolUsuario (UserId, Rol) {
        const User = await this.read(UserId)
        if (!User) return null
        if (User.rol.includes(Rol)) {
            User.rol = User.rol.filter((RolUser) => RolUser !== Rol)
            const NewUser = await this.update(UserId, User)
            return NewUser || null
        } else {
            return false
        }
    }

    async ListaAliasUsuario (FULL = false) {
        const ListaAlias = {}
        const ListaUsuarios = await this.readAll()
        if (ListaUsuarios) {
            ListaUsuarios.forEach((element) => {
                if (element.alias) {
                    ListaAlias[element.alias.toLowerCase()] = { _id: element._id }
                    if (FULL) {
                        ListaAlias[element.alias.toLowerCase()].fotoPerfil = element.fotoPerfil
                    }
                }
            })
        }
        return ListaAlias
    }

    async ListaAmigosUsuario (UserId, FULL = false) {
        const ListaAmigos = []
        const User = await this.read(UserId)
        if (User) {
            if (FULL) {
                for (const AmigoId of User.amigos) {
                    const Amigo = await this.read(AmigoId)
                    if (Amigo) {
                        ListaAmigos.push(Amigo)
                    }
                }
            } else {
                ListaAmigos.push(...User.amigos)
            }
        }
        return ListaAmigos
    }

    async CheckAliasUsuario (alias) {
        const ListaAlias = await this.ListaAliasUsuario()
        const AliasBuscado = ListaAlias[alias.toLowerCase()]
        if (AliasBuscado) {
            return { existe: true, alternativos: await this.#GeneraAliasAlternativo(alias, ListaAlias), _id: AliasBuscado._id }
        } else {
            return { existe: false }
        }
    }

    async #GeneraAliasAlternativo (alias, ListaAlias) {
        const ListaAliasAlternativos = []
        for (let i = 1; i <= 10; i++) {
            const NewAlias = alias + Funciones.RamdomNumber(100, 999)
            if (!ListaAlias[NewAlias.toLowerCase()]) {
                ListaAliasAlternativos.push(NewAlias)
            }
        }
        return ListaAliasAlternativos.sort()
    }

    async IsAdmin (id) {
        const User = await this.read(id)
        return (User && User.rol.includes('admin'))
    }

    async IsActive (id) {
        const User = await this.read(id)
        return (User && User.estado === 1)
    }

    async IsRol (id, rol) {
        const User = await this.read(id)
        return (User && (User.rol.includes(rol) || User.rol.includes('admin')))
    }

    async GetAllUsersWithoutKeys () {
        const Users = await this.readAll()
        if (!Users || Users.length === 0) { return null }
        const filteredUsers = Users.map(usuario => ({
            _id: usuario._id,
            usuario: usuario.usuario,
            alias: usuario.alias,
            nombre: usuario.nombre,
            amigos: usuario.amigos,
            fotoPerfil: usuario.fotoPerfil,
            edited: usuario.edited,
            created: usuario.created,
            lastLogin: usuario.lastLogin,
            saldo: usuario.saldo,
            challengesCompletados: usuario.challengesCompletados,
            nivel: usuario.nivel,
            views: usuario.views,
            socialLinks: usuario.socialLinks,
            bioInfo: usuario.bioInfo,
            estado: usuario.estado,
            rol: usuario.rol,
            isVerified: usuario.isVerified,
            favoriteArticles: usuario.favoriteArticles,
        }));
        return filteredUsers
    }

    async AñadeChallengeCumplido (UserId, challengeId, recompensa) {
        const User = await this.read(UserId)
        if (!User) return null
        if (User.challengesCompletados.includes(challengeId)) return null
        User.challengesCompletados.push(challengeId)
        User.saldo += recompensa
        const NewUser = await this.update(UserId, User)
        return NewUser || null
    }

    async IncrementarViews (viewedUserId, currentUserId) {
        try {
            const Usuario = await this.read(viewedUserId)
            if (!Usuario) return "Usuario no existe"
            if (!Usuario.views.includes(currentUserId)) {
                Usuario.views.push(currentUserId)
            }
            const updatedMsg = await this.update(viewedUserId, Usuario)
            if (updatedMsg) { return "Visita añadida" }
            else { return null }
        } catch (error) {
            throw new Error(`Error incrementing views: ${error.message}`)
        }
    }

    async ObtenerFollowers (userId) {
        const Usuario = await this.read(userId)
        if (!Usuario) return null
        const ListaUsuarios = await this.readAll()
        let followers = []
        ListaUsuarios.forEach((usuario) => {
            if (usuario._id !== userId) {
                usuario.amigos.forEach((amigo) => {
                    if (amigo === userId) {
                        followers.push(usuario._id)
                    }
                })
            }
        })
        return followers
    }

    async AlternaMsgToFavorites (msgId, userId) {
        const User = await this.read(userId)
        if (!User) return null
        if (User.favoriteArticles.includes(msgId)) {
            User.favoriteArticles = User.favoriteArticles.filter(favMsgId => favMsgId !== msgId);
        } else {
            User.favoriteArticles.push(msgId)
        }
        const NewUser = await this.update(userId, User)
        return NewUser || null
    }

    async GetDashboardData () {
        const ListaUsuarios = await this.readAll()
        if (!ListaUsuarios) return false;
        const UsersData = {
            numberOfUsers: 0,
        }
        UsersData.numberOfUsers = ListaUsuarios.length
        return UsersData
    }

    async AlternaUserVerification (userId) {
        const User = await this.read(userId)
        if (!User) return null
        User.isVerified = !User.isVerified
        const NewUser = await this.update(userId, User)
        return NewUser || null
    }
}

module.exports = UserModel
