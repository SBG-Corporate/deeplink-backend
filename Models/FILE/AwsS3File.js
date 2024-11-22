const { S3Client, ListObjectsCommand, PutObjectCommand, DeleteObjectCommand, GetObjectTaggingCommand } = require('@aws-sdk/client-s3')

const ConfigData = require('../../Config/config')

function DebugSend (...args) {
    const DebugLevel = true
    if (DebugLevel) { console.log(...args) }
}

class AwsS3File {
    #s3Conex

    constructor (_NombreBucket) {
        if (ConfigData.ConfigDB.aws === null) {
            throw new Error('No se ha configurado la conexion de AWS')
        }
        const { Region, Id, Secret } = ConfigData.ConfigDB.aws
        this.#s3Conex = new S3Client({
            credentials: { accessKeyId: Id, secretAccessKey: Secret },
            region: Region
        })
        this.bucketName = _NombreBucket
    }

    async #existeFile (userId, size, originalname) {
        const ListaFiles = await this.ReadAll(userId)
        for (const File of ListaFiles) {
            if ((File.size === size) && (File.originalName === originalname)) return true
        }
        return false
    }

    async Create (data) {
        try {
            const regexAwsTagValue = /^([\p{L}\p{Z}\p{N}_.:/=+\-@]*)$/u
            if (!regexAwsTagValue.test(data.originalname)) data.originalname = data.userId + '_' + data.size
            const params = {
                Bucket: this.bucketName,
                Key: data.userId + '/' + data.fileId,
                Body: data.buffer,
                Tagging: 'userId=' + data.userId +
                    '&fileId=' + data.fileId +
                    '&mimeType=' + data.mimetype +
                    '&originalName=' + data.originalname,
                ContentType: data.mimetype
            }
            if (await this.#existeFile(data.userId, data.size, data.originalname)) return false
            const Resp = await this.#s3Conex.send(new PutObjectCommand(params))
            if (Resp.$metadata.httpStatusCode !== 200) throw new Error('Error al crear fichero ' + data.key)
            return await this.Read(params.Key)
        } catch (error) {
            DebugSend('Error al crear fichero ' + data.key + ' -> ', error)
            throw new Error('Error al crear fichero ' + data.key)
        }
    }

    async ReadAll (Prefix = null) {
        try {
            const Params = { Bucket: this.bucketName }
            if (Prefix !== null) { Params.Prefix = Prefix }
            const listObjectsResponse = await this.#s3Conex.send(new ListObjectsCommand(Params))
            const objects = listObjectsResponse.Contents
            if (!objects) return []

            const objectsWithTags = []
            for (const object of objects) {
                const taggingResponse = await this.#s3Conex.send(new GetObjectTaggingCommand({ Bucket: this.bucketName, Key: object.Key }))
                const objectTags = taggingResponse.TagSet
                const Salida = { lastModified: object.LastModified, size: object.Size }
                for (const tag of objectTags) {
                    Salida[tag.Key] = tag.Value
                }
                Salida.url = 'https://' + this.bucketName + '.s3.' + ConfigData.ConfigDB.aws.Region + '.amazonaws.com/' + object.Key
                objectsWithTags.push(Salida)
            }
            return objectsWithTags
        } catch (error) {
            DebugSend('Error al leer archivos de S3 -> ', error)
            throw new Error('Error al leer archivos de S3')
        }
    }

    async Read (Prefix) {
        try {
            const response = await this.ReadAll(Prefix)
            if (response.length !== 1) throw new Error('Error al leer fichero ' + Prefix)
            return response[0]
        } catch (error) {
            DebugSend('Error al leer fichero ' + Prefix + ' -> ', error)
            throw new Error('Error al leer fichero ' + Prefix)
        }
    }

    async ReadId (Id) {
        try {
            const Params = { Bucket: this.bucketName }
            const listObjectsResponse = await this.#s3Conex.send(new ListObjectsCommand(Params))
            const objects = listObjectsResponse.Contents
            if (!objects) return []

            for (const object of objects) {
                const taggingResponse = await this.#s3Conex.send(new GetObjectTaggingCommand({ Bucket: this.bucketName, Key: object.Key }))
                const objectTags = taggingResponse.TagSet
                const Salida = { lastModified: object.LastModified, size: object.Size }
                for (const tag of objectTags) {
                    Salida[tag.Key] = tag.Value
                }
                Salida.url = 'https://' + this.bucketName + '.s3.' + ConfigData.ConfigDB.aws.Region + '.amazonaws.com/' + object.Key
                if (Salida.fileId === Id) return Salida
            }
            return null
        } catch (error) {
            DebugSend('Error al leer archivos de S3 -> ', error)
            throw new Error('Error al leer archivos de S3')
        }
    }

    async Delete (key) {
        try {
            await this.#s3Conex.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }))
            return true
        } catch (error) {
            DebugSend('Error al borrar fichero ' + key + ' -> ', error)
            throw new Error('Error al borrar fichero ' + key)
        }
    }
}

module.exports = AwsS3File
