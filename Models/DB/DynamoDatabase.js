const { DynamoDBClient, GetItemCommand, DeleteItemCommand, ScanCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb')
const { unmarshall, marshall } = require('@aws-sdk/util-dynamodb')

const ConfigData = require('../../Config/config')
const { generateId } = require('../../Helper/funciones')

function DebugSend (...args) {
    const DebugLevel = true
    if (DebugLevel) { console.log(...args) }
}

class DynamoDatabase {
    #dynamoDB
    #strongId
    constructor (_IndiceTabla, _NombreTabla, _StrongID = false) {
        if (ConfigData.ConfigDB.aws === null) {
            throw new Error('No se ha configurado la conexion de AWS')
        }
        this.tableName = _NombreTabla
        this.tableIndex = _IndiceTabla
        this.#strongId = _StrongID
        this.CamposMinimos = ['_id']
        // Connection
        const { Region, Id, Secret } = ConfigData.ConfigDB.aws
        this.#dynamoDB = new DynamoDBClient({
            region: Region,
            credentials: { accessKeyId: Id, secretAccessKey: Secret }
        })
    }

    Parse (Objeto, full = false) {
        if (full) return Objeto
        if (Array.isArray(Objeto)) {
            const ListaObjetos = []
            Objeto.forEach((element) => { ListaObjetos.push(this.Reduce(element)) })
            return ListaObjetos
        } else {
            return this.Reduce(Objeto)
        }
    }

    Reduce (Objeto, Campos = null) {
        if (Campos === null) {
            Campos = this.CamposMinimos
        }
        const NewObjeto = {}
        Campos.forEach((element) => { NewObjeto[element] = Objeto[element] })
        return NewObjeto
    }

    clearCampos (Objeto) {
        delete Objeto._tabla
        return Objeto
    }

    async #generateIdUnico () {
        let Id = generateId()
        if (this.#strongId) {
            let user = await this.read(Id)
            while (user) {
                Id = generateId()
                user = await this.read(Id)
            }
        } else {
            return Id
        }
    }

    async create (Data, Id = null) {
        Data._tabla = this.tableIndex
        const _id = Id || await this.#generateIdUnico()
        Data._id = _id

        const params = {
            TableName: this.tableName,
            Item: marshall(Data),
            ExpressionAttributeNames: { '#id': '_id' },
            ConditionExpression: 'attribute_not_exists(#id)'
        }

        try {
            await this.#dynamoDB.send(new PutItemCommand(params), { mode: 'no-cors' })
            return this.read(_id)
        } catch (error) {
            DebugSend('Error creating ' + this.tableIndex + ':', _id, Data, error)
            return false
        }
    }

    async update (Id, Data) {
        const BackupData = this.read(Id)
        if (await this.delete(Id) === 1) {
            const NewData = await this.create(Data, Id)
            if (NewData) {
                return NewData
            } else {
                await this.create(BackupData, Id)
                return false
            }
        } else {
            return false
        }
    }

    async readAll () {
        const params = {
            TableName: this.tableName,
            FilterExpression: '#_tabla = :_tabla',
            ExpressionAttributeNames: { '#_tabla': '_tabla' },
            ExpressionAttributeValues: { ':_tabla': { S: this.tableIndex } },
            ConditionExpression: 'attribute_exists(_tabla)'
        }
        const data = await this.#dynamoDB.send(new ScanCommand(params))
        const Salida = []
        data.Items.forEach(element => {
            const NewItem = this.clearCampos(unmarshall(element))
            if (NewItem.estado === 1) Salida.push(NewItem)
        })
        return Salida
    }

    async search (_key, _value) {
        const AllItems = await this.readAll()
        const Salida = []
        AllItems.forEach(element => {
            if (element[_key].toLowerCase().includes(_value.toLowerCase())) {
                Salida.push(element)
            }
        })
        return Salida
    }

    async searchSpecificValue (_key, _value) {
        const AllItems = await this.readAll();
        const Salida = [];
        AllItems.forEach(element => {
            if (element[_key].toLowerCase() === _value.toLowerCase()) {
                Salida.push(element);
            }
        });
        return Salida;
    }


    async read (Id) {
        const params = {
            TableName: this.tableName,
            Key: { _id: { S: Id }, _tabla: { S: this.tableIndex } },
            ConditionExpression: 'attribute_exists(_id)'
        }

        try {
            const data = await this.#dynamoDB.send(new GetItemCommand(params))
            return this.clearCampos(unmarshall(data.Item))
        } catch (error) {
            if (error.message !== 'No value defined: {}') {
                DebugSend('Error reading ' + this.tableIndex + ':', Id, error)
            }
            return null
        }
    }

    async delete (Id) {
        const params = {
            TableName: this.tableName,
            Key: { _id: { S: Id }, _tabla: { S: this.tableIndex } },
            ExpressionAttributeNames: { '#id': '_id' },
            ConditionExpression: 'attribute_exists(#id)'
        }

        try {
            await this.#dynamoDB.send(new DeleteItemCommand(params))
            return 1
        } catch (error) {
            DebugSend('Error deleting ' + this.tableIndex + ':', Id, error)
            return 0
        }
    }
}

module.exports = DynamoDatabase
