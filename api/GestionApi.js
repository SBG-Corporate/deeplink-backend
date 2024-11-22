const express = require('express')
const router = express.Router()
const GestionController = require('../Controllers/GestionController')
const RateLimiter = require('../Middleware/RateLimitMiddleware')
const { verifyToken, onlyAdmin, onlyRol } = require('../Middleware/AuthMiddleware')
const { validaDatos, validarId, validarTexto, validarEstado } = require('../Helper/validaciones')

router.use(RateLimiter(1000, 4))
router.use(verifyToken)

router.get('/user', onlyRol(['moderador', 'auditor']), GestionController.UserGetAll)
router.get('/user/:_id', validarId(), validaDatos, onlyRol(['moderador', 'auditor']), GestionController.UserGet)
router.patch('/user/:_id', validarId(), validaDatos, onlyAdmin, GestionController.UserUpdate)
router.delete('/user/:_id', validarId(), validaDatos, onlyAdmin, GestionController.UserRealDelete)
router.post('/estado/:_id/:estado', validarId(), validarEstado(), validaDatos, onlyRol(['moderador']), GestionController.UserSetEstado)
router.get('/rol', onlyRol(['moderador']), GestionController.UserGetAllRol)
router.get('/rol/:_rol', onlyRol(['moderador']), GestionController.UserGetRol)
router.post('/rol/:_id', validarId(), validarTexto('rol'), validaDatos, onlyRol(['moderador']), GestionController.UserAddRol)
router.delete('/rol/:_id', validarId(), validarTexto('rol'), validaDatos, onlyRol(['moderador']), GestionController.UserDeleteRol)
router.get('/getDashboardData', onlyAdmin, GestionController.GetDashboardData)

module.exports = router
