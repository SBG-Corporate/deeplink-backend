/* eslint-disable camelcase */
const DynamoDatabase = require('./DB/DynamoDatabase')
const Funciones = require('../Helper/funciones')

class RetoModel extends DynamoDatabase {
    constructor (_IndiceTabla = 'Retos', _NombreTabla = 'DeepLink_CORE') {
        super(_IndiceTabla, _NombreTabla)
        this.CamposMinimos = ['_id', 'nombre', 'descripcion', 'recompensa', 'estado', 'created', 'edited']
        this.CamposEditables = ['nombre', 'descripcion']
    }

    async RegistraReto (Data) {
        const TimeNow = Number(Funciones.getTimeStamp())
        const DatosReto = {
            nombre: Data.nombre,
            descripcion: Data.descripcion,
            recompensa: Data.recompensa,
            estado: 1,
            created: TimeNow,
            edited: TimeNow
        }
        const NewReto = await this.create(DatosReto)
        return NewReto || null
    }

    async ActualizaReto (id, data, Internal = false) {
        const Reto = await this.read(id)
        if (!Reto) return null
        if (Internal) {
            Object.keys(data).forEach(key => {
                Reto[key] = data[key]
            })
        } else {
            this.CamposEditables.forEach(element => {
                Reto[element] = data[element] || Reto[element]
            })
        }
        const NewReto = await this.update(id, Reto)
        return NewReto || null
    }

    async BorraReto (id) {
        const Reto = await this.read(id)
        if (!Reto) return null
        Reto.estado = 0
        const NewReto = await this.update(id, Reto)
        return NewReto || null
    }

    async CambiaRecompensa (id, Recompensa) {
        const Reto = await this.read(id)
        if (!Reto) return null
        Reto.recompensa = Recompensa
        const NewReto = await this.update(id, Reto)
        return NewReto || null
    }
}

module.exports = RetoModel
