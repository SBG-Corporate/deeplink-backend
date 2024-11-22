const { param, body, query } = require('express-validator')

const validaDatos = (req, res, next) => {
    const { validationResult } = require('express-validator')
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    next()
}

function GetDato (Nombre, Origen) {
    switch (Origen) {
        case 'param': return param(Nombre)
        case 'body': return body(Nombre)
        case 'query': return query(Nombre)
        default: return body(Nombre)
    }
}

const validarId = (Nombre = '_id', Origen = 'param') => {
    const Dato = GetDato(Nombre, Origen)
    return [Dato
        .matches(/^[0-9a-fA-F]{24}$/)
        .withMessage(`El campo '${Nombre}' debe ser un ID válido en '${Origen}'.`)
    ]
}

const validarTexto = (Nombre, Origen = 'body') => {
    const Dato = GetDato(Nombre, Origen)
    return [Dato
        .isString()
        .isLength({ min: 3, max: 255 })
        .withMessage(`El campo '${Nombre}' debe ser un texto de entre 3 y 255 caracteres en '${Origen}'.`)
    ]
}

const validarTextoLargo = (Nombre, Origen = 'body') => {
    const Dato = GetDato(Nombre, Origen)
    return [Dato
        .isString()
        .isLength({ min: 2 })
        .withMessage(`El campo '${Nombre}' debe ser un texto de mas de 2 caracteres en '${Origen}'.`)
    ]
}

const validarEmail = (Nombre = 'email', Origen = 'body') => {
    const Dato = GetDato(Nombre, Origen)
    return [Dato
        .isEmail()
        .withMessage(`El campo '${Nombre}' debe ser un email válido en '${Origen}'.`)
    ]
}

const validarParamExist = (Nombre, Origen = 'body') => {
    const Dato = GetDato(Nombre, Origen)
    return [Dato
        .notEmpty()
        .withMessage(`El campo '${Nombre}' no puede estar vacío en '${Origen}'.`)
    ]
}

const validarIdioma = (Nombre = 'idioma', Origen = 'body') => {
    const Dato = GetDato(Nombre, Origen)
    return [Dato
        .isIn(['es', 'en'])
        .withMessage(`El campo '${Nombre}' solo acepta los valores 'es' o 'en' en '${Origen}'.`)
    ]
}

const validarEstado = (Nombre = 'estado', Origen = 'param') => {
    const Dato = GetDato(Nombre, Origen)
    return [Dato
        .isInt({ min: -1, max: 2 })
        .withMessage(`El campo '${Nombre}' solo acepta los valores -1, 0, 1 o 2 en '${Origen}'.`)
    ]
}

const validarNumero = (Nombre = 'saldo', Origen = 'body') => {
    const Dato = GetDato(Nombre, Origen)
    return [Dato
        .isInt()
        .withMessage(`El campo '${Nombre}' debe ser un número entero en '${Origen}'.`)
    ]
}

const validarBool = (Nombre, Origen = 'body') => {
    const Dato = GetDato(Nombre, Origen)
    return [Dato
        .isString()
        .isBoolean()
        .withMessage(`El campo '${Nombre}' solo acepta los valores 'true' o 'false' en '${Origen}'.`)
    ]
}

const validarArchivo = (Nombre, Origen = 'body') => {
    const Dato = GetDato(Nombre, Origen)
    return [Dato
        .custom((value, { req }) => {
            if (!req.file) {
                throw new Error('No se ha enviado ningún archivo.')
            }
            return true
        })
    ]
}

module.exports = {
    validaDatos,
    validarId,
    validarTexto,
    validarTextoLargo,
    validarEmail,
    validarParamExist,
    validarIdioma,
    validarEstado,
    validarBool,
    validarArchivo,
    validarNumero
}
