const ErrorSend = require('../Helper/errores')
const rateLimit = require('express-rate-limit')
const ConfigData = require('../Config/config')

const RateLimiter = (timeWindow, maxRequests) => {
    const limiter = rateLimit({
        windowMs: timeWindow,
        max: maxRequests,
        message: `Ha excedido el límite de ${maxRequests} solicitudes en ${timeWindow / 1000} segundos. Inténtelo de nuevo más tarde.`
    })

    return (req, res, next) => {
        if ((ConfigData.entorno === 'test') || (ConfigData.entorno === 'local')) { return next() }
        limiter(req, res, (err) => {
            if (err) {
                return ErrorSend(res, 429, err)
            }
            return next()
        })
    }
}

module.exports = RateLimiter
