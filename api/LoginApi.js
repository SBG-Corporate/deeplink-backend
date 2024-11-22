const express = require('express')
const router = express.Router()
const LoginController = require('../Controllers/LoginController')
const RateLimiter = require('../Middleware/RateLimitMiddleware')
const { validaDatos, validarEmail, validarIdioma, validarParamExist } = require('../Helper/validaciones')

router.post('/', RateLimiter(60 * 1000, 1), validarEmail(), validarIdioma(), validaDatos, LoginController.Login)
router.post('/auth', RateLimiter(1000, 1), validarEmail(), validarParamExist('token'), validaDatos, LoginController.Auth)

module.exports = router
