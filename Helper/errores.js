const ConfigData = require('../Config/config')

function ErrorSend (res, status = 200, mensaje = null) {
    if ((mensaje === null) || (ConfigData.IsProduction)) {
        return res.status(status).send().end()
    } else {
        if (typeof mensaje === 'string') {
            res.status(status).send(mensaje)
        } else if (typeof mensaje === 'object') {
            res.status(status).json(mensaje)
        } else {
            return res.status(status).send().end()
        }
    }
}

module.exports = ErrorSend
