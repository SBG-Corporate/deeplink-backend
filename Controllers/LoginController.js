const ErrorSend = require('../Helper/errores')
// const DebugSend = require('../Helper/debug')
const Funciones = require('../Helper/funciones')
const MailGenerator = require('../Helper/MailGenerator')
const MailSender = require('../Helper/MailSender')
const ConfigData = require('../Config/config')
const CryptoUtils = require('../Helper/CryptoUtils')
const JwtService = require('../Middleware/AuthMiddleware')
const UserModel = require('../Models/UserModel')
const UserDB = new UserModel()

/*
    Login Steps:
    1- Receive email (Login)
        - Generate Token
        - Generate Url
        - Send Email
    2- Web Receive Token (TempWeb)
    3- Api Validate Token (TempWeb)
        - Generate New Token
        - Creates or receives user data in DB
        - Sends info to Web
*/

async function Login (req, res) {
    const Usuario = String(req.body.email).toLowerCase()
    const Idioma = req.body.idioma ? String(req.body.idioma).toLowerCase() : 'es'
    const PayLoad = {
        email: Usuario,
        created: parseInt(Funciones.getTimeStamp()),
        expire: ConfigData.ConfigKeys.LoginExpire
    }

    const TokenEncryp = CryptoUtils.Encrypt(JSON.stringify(PayLoad), Usuario)
    const msg = MailGenerator.GenerateMSG(ConfigData.FrontUrl + '?email=' + Usuario + '&token=' + encodeURIComponent(TokenEncryp), ConfigData.ServEmail.supportMail, Idioma)
    if (req.body.ModoPrueba === true) {
        return res.json({ data: msg.text, token: TokenEncryp })
    } else {
        try {
            const RespMail = await MailSender(Usuario, MailGenerator.GenerateSubject(), msg)
            return res.json({ sendMail: RespMail })
        } catch (err) {
            return ErrorSend(res, 500, { error: 'Error envio Email', err })
        }
    }
}

async function Auth (req, res) {
    const expiresIn = ConfigData.ConfigKeys.AuthExpire
    const Usuario = String(req.body.email).toLowerCase()
    if (!ValidaToken(req.body.token, Usuario)) {
        return ErrorSend(res, 401, 'Token no válido')
    } else {
        const user = await UserDB.search('usuario', Usuario)
        if (user.length > 0) {
            const followers = await UserDB.ObtenerFollowers(user[0]._id)
            const UsuarioDataExtended = { ...user[0], followers }
            return res.status(200).json({ account: UsuarioDataExtended, token: JwtService.GeneraToken({ _id: user[0]._id }, expiresIn), expire: Funciones.getTimeStamp(expiresIn) })
        } else {
            const NewUser = await UserDB.RegistraUsuario(Usuario)
            if (NewUser === false) return ErrorSend(res, 500, { error: 'Error al crear usuario' })
            return res.status(201).json({ account: NewUser, token: JwtService.GeneraToken({ _id: NewUser._id }, expiresIn), expire: Funciones.getTimeStamp(expiresIn) })
        }
    }
}

function ValidaToken (TokenEncryp, Usuario) {
    try {
        const Token = JSON.parse(CryptoUtils.Decrypt(TokenEncryp, Usuario))
        if (Token.email !== Usuario) return false
        return Funciones.timestampValido(Token.created, Token.expire)
    } catch {
        return false
    }
}

module.exports = {
    Login,
    Auth
}
