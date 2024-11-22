const DynamoDatabase = require('./DB/DynamoDatabase')

class PassVaultModel extends DynamoDatabase {
    constructor (_IndiceTabla = 'PassVaults', _NombreTabla = 'DeepLink_CORE') {
        super(_IndiceTabla, _NombreTabla)
    }

    async GuardaClavePrivada (_id, privateKeyPEM) {
        let NewDoc = null
        const Doc = await this.read(_id)
        if (Doc) {
            Doc.privateKeyPEM = privateKeyPEM
            NewDoc = await this.update(_id, Doc)
        } else {
            NewDoc = await this.create({ privateKeyPEM }, _id)
        }
        if (NewDoc) {
            return true
        }
        return false
    }

    async GetPK (id) {
        const Doc = await this.read(id)
        if (Doc) {
            return Doc.privateKeyPEM
        } else {
            return null
        }
    }
}

module.exports = PassVaultModel
