const express = require('express')
const router = express.Router()
const ChallengeController = require('../Controllers/ChallengeController')
const RateLimiter = require('../Middleware/RateLimitMiddleware')
const { onlyUserActive, onlyAdmin } = require('../Middleware/AuthMiddleware')
const { validarId } = require('../Helper/validaciones')

router.use(RateLimiter(1000, 4))

router.get('/getAllChallenges', ChallengeController.GetAllChallenges) //devuelve todos los challenges y si el usuario los ha completado
router.get('/checkAllChallenges', onlyUserActive, ChallengeController.CheckAllChallenges) //devuelve info sobre si los challenges están completados o no
router.post('/validate/:_id', validarId(), onlyUserActive, ChallengeController.ValidateChallenge) // Valida si un challenge ha sido completado
router.post('/create', onlyAdmin, ChallengeController.CreateChallenge) // Crea un nuevo challenge
router.delete('/delete/:_id', validarId(), onlyAdmin, ChallengeController.DeleteChallenge) // Elimina un challenge
router.patch('/update/:_id', validarId(), onlyAdmin, ChallengeController.UpdateChallenge) // Actualiza un challenge
router.post('/toggleEnable/:_id', validarId(), onlyAdmin, ChallengeController.ToggleEnableChallenge) // Habilita o deshabilita un challenge

module.exports = router
