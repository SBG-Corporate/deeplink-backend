const express = require('express')
const router = express.Router()
const RootController = require('../Controllers/RootController')
const RateLimiter = require('../Middleware/RateLimitMiddleware')

router.use(RateLimiter(1000, 4))
router.get('/', RootController.Root)
router.get('/ping', RootController.Ping)
router.get('/favicon.ico', RootController.FavIcon)

module.exports = router
