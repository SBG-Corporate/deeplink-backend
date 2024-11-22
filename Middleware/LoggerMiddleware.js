const ConfigData = require('../Config/config')
const DebugSend = require('../Helper/debug')

const logger = (req, res, next) => {
    if (ConfigData.entorno !== 'test') {
        DebugSend(req.method, '->', req.originalUrl, ',Body:', req.body, ',Params:', req.params, ',Query:', req.query)
    }
    next()
}

module.exports = logger
