const express = require('express')
const router = express.Router()
const FileController = require('../Controllers/FileController')
const RateLimiter = require('../Middleware/RateLimitMiddleware')
const { verifyToken, onlyRol, onlyUserActive } = require('../Middleware/AuthMiddleware')
const { validarArchivo, validarId, validaDatos } = require('../Helper/validaciones')
const multer = require('multer')
const storage = multer.memoryStorage()
const MaxFileSice = 5
const upload = multer({
    storage,
    limits: { fileSize: MaxFileSice * 1024 * 1024 }
})

function handleMulterError (err, req, res, next) {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'El archivo supera el tamaño máximo permitido (' + MaxFileSice + ' MB)' })
    }
    next(err)
}

router.use(RateLimiter(1000, 4))
router.use(verifyToken, onlyUserActive)
router.get('/all', onlyRol(['moderador']), FileController.GetAllFileList)
router.get('/', FileController.GetUserFileList)
router.post('/', upload.single('file'), handleMulterError, validarArchivo('file'), validaDatos, FileController.UploadFile)
router.delete('/:fileId', validarId('fileId', 'param'), validaDatos, FileController.DeleteUserFile)

module.exports = router
