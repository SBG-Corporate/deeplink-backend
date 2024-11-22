const ErrorSend = require('../Helper/errores')
const ConfigData = require('../Config/config')
const FileBucket = require('../Models/FILE/AwsS3File')
const BucketName = (ConfigData.entorno === 'test') ? ConfigData.ConfigDB.aws.Bucket + '-test' : ConfigData.ConfigDB.aws.Bucket
const s3FileManager = new FileBucket(BucketName)
const { generateId } = require('../Helper/funciones')
const { GetTokenText } = require('../Middleware/AuthMiddleware')

async function GetAllFileList (req, res) {
    try {
        const files = await s3FileManager.ReadAll()
        res.json(files)
    } catch (err) {
        return ErrorSend(res, 500, { error: 'GetAllFileList: Error al leer archivos de S3', err })
    }
}

async function GetUserFileList (req, res) {
    try {
        const UserId = GetTokenText(req)._id
        const files = await s3FileManager.ReadAll(UserId)
        res.json(files)
    } catch (err) {
        return ErrorSend(res, 500, { error: 'GetUserFileList: Error al leer archivos de S3', err })
    }
}

async function UploadFile (req, res) {
    if (!req.file) {
        return ErrorSend(res, 400, { error: 'UploadFile: No se ha proporcionado un archivo' })
    }
    try {
        const fileId = generateId()
        const userId = GetTokenText(req)._id
        const { originalname, buffer, mimetype, size } = req.file
        const Data = {
            userId,
            fileId,
            originalname,
            mimetype,
            size,
            buffer
        }
        const response = await s3FileManager.Create(Data)
        if (!response) {
            return ErrorSend(res, 400, { error: 'UploadFile: El archivo ya existe' })
        }
        return res.status(201).json(response)
    } catch (err) {
        return ErrorSend(res, 500, { error: 'UploadFile: Error al subir el archivo a S3', err })
    }
}

async function DeleteUserFile (req, res) {
    const key = GetTokenText(req)._id + '/' + req.params.fileId
    try {
        const response = await s3FileManager.Delete(key)
        res.json(response)
    } catch (err) {
        return ErrorSend(res, 500, { error: 'DeleteUserFile: Error al borrar el archivo de S3', key })
    }
}

async function GetFileInfo (Id) {
    return await s3FileManager.ReadId(Id)
}

module.exports = {
    GetAllFileList,
    GetUserFileList,
    UploadFile,
    DeleteUserFile,
    GetFileInfo
}
