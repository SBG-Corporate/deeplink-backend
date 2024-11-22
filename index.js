const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const dotenv = require('dotenv')
dotenv.config({ path: './.env' })
const ConfigData = require('./Config/config')
const DebugSend = require('./Helper/debug')
const app = express()
app.set('trust proxy', 1)

// Middelware
app.disable('x-powered-by')
app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(helmet())
app.use(mongoSanitize())
app.use(xss())
app.use(require('./Middleware/LoggerMiddleware'))

// Routes
app.use('/', require('./api/RootApi'))
app.use('/gestion', require('./api/GestionApi'))
app.use('/login', require('./api/LoginApi'))
app.use('/user', require('./api/UserApi'))
app.use('/grupo', require('./api/GrupoApi'))
app.use('/file', require('./api/FileApi'))
app.use('/msg', require('./api/MsgApi'))
app.use('/challenges', require('./api/ChallengeApi'))

// Default 404 Error
app.use(express.static('Views'), function (req, res) {
    res.status(404).sendFile('./Views/404.html', { root: __dirname })
})

app.listen(ConfigData.port, () => {
    DebugSend('App ->', ConfigData.url, '->', ConfigData.entorno)
})
module.exports = app
