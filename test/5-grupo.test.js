/* eslint-disable no-undef */
process.env.VERCEL_ENV = 'test'
const request = require('supertest')
const app = require('../index')
// eslint-disable-next-line no-unused-vars
const { expect } = require('chai')
const User1 = { email: 'test@gmail.com', AuthToken: '', UserToken: '', UserID: '', Alias: 'AliasTest' }
const User2 = { email: 'test2@gmail.com', AuthToken: '', UserToken: '', UserID: '', Alias: 'AliasTest2' }
const Grupo1 = { nombre: 'GrupoDePrueba', _id: '' }
const Grupo2 = { nombre: 'GrupoDePrueba2', _id: '' }
const IdNoExiste = '14cc9f4a1b57ea151baf521b'

describe('Grupos Test -> "/grupo"', function () {
    before(function (done) {
        request(app)
            .post('/login')
            .send({ email: User1.email, idioma: 'es', ModoPrueba: true })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                User1.AuthToken = res.body.token
                done()
            })
    })
    before(function (done) {
        request(app)
            .post('/login/auth')
            .send({ email: User1.email })
            .send({ token: User1.AuthToken })
            .expect(function (res) {
                if (res.status !== 200 && res.status !== 201) {
                    throw new Error('Código de estado incorrecto')
                }
            })
            .end(function (err, res) {
                if (err) return done(err)
                User1.UserToken = res.body.token
                User1.UserID = res.body.account._id
                done()
            })
    })
    before(function (done) {
        request(app)
            .post('/login')
            .send({ email: User2.email, idioma: 'es', ModoPrueba: true })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                User2.AuthToken = res.body.token
                done()
            })
    })
    before(function (done) {
        request(app)
            .post('/login/auth')
            .send({ email: User2.email })
            .send({ token: User2.AuthToken })
            .expect(function (res) {
                if (res.status !== 200 && res.status !== 201) {
                    throw new Error('Código de estado incorrecto')
                }
            })
            .end(function (err, res) {
                if (err) return done(err)
                User2.UserToken = res.body.token
                User2.UserID = res.body.account._id
                done()
            })
    })
    before(async function () {
        const UserModel = require('../Models/UserModel')
        const UserDB = new UserModel()
        await UserDB.ActualizaUsuario(User1.UserID, { estado: 1, alias: User1.Alias }, true)
        await UserDB.ActualizaUsuario(User2.UserID, { estado: 0, alias: User2.Alias, rol: ['user'] }, true)
    })
    it('Listar todos los grupos Token Incorrecto GET /grupo -> 401', function (done) {
        request(app)
            .get('/grupo')
            .set('authorization', 'Bearer 1234')
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Listar todos los grupos GET /grupo -> 200', function (done) {
        request(app)
            .get('/grupo')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body).to.be.an('array')
                done()
            })
    })
    it('Crear Grupo sin estar Activo POST /grupo -> 401', function (done) {
        request(app)
            .post('/grupo')
            .send({ nombre: Grupo1.nombre })
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Crear Grupo nombre incorrecto POST /grupo -> 400', function (done) {
        request(app)
            .post('/grupo')
            .send({ nombre: '2' })
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Crear Grupo correcto  POST /grupo -> 201', function (done) {
        request(app)
            .post('/grupo')
            .send({ nombre: Grupo1.nombre })
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(201)
            .end(function (err, res) {
                // console.log('Body:', res.body)
                if (err) return done(err)
                expect(res.body.nombre).to.equal(Grupo1.nombre)
                expect(res.body.estado).to.equal(0)
                expect(res.body.miembros[0]).to.equal(User1.UserID)
                Grupo1._id = res.body._id
                done()
            })
    })
    it('Crear Grupo correcto2  POST /grupo -> 201', function (done) {
        request(app)
            .post('/grupo')
            .send({ nombre: Grupo2.nombre })
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(201)
            .end(function (err, res) {
                // console.log('Body:', res.body)
                if (err) return done(err)
                expect(res.body.nombre).to.equal(Grupo2.nombre)
                expect(res.body.estado).to.equal(0)
                expect(res.body.miembros[0]).to.equal(User1.UserID)
                Grupo2._id = res.body._id
                done()
            })
    })
    it('Crear Grupo duplicado  POST /grupo -> 400', function (done) {
        request(app)
            .post('/grupo')
            .send({ nombre: Grupo1.nombre })
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Leer Grupo NoExiste GET /grupo/$Id -> 404', function (done) {
        request(app)
            .get('/grupo/' + IdNoExiste)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(404)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Leer Grupo Corto GET /grupo/$Id -> 200', function (done) {
        request(app)
            .get('/grupo/' + Grupo1._id)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body.nombre).to.equal(Grupo1.nombre)
                expect(res.body.miembros[0]).to.equal(User1.UserID)
                done()
            })
    })
    it('Leer Grupo con todo GET /grupo/$Id -> 200', function (done) {
        request(app)
            .get('/grupo/' + Grupo1._id)
            .query({ full: true })
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body.miembros[0]._id).to.equal(User1.UserID)
                done()
            })
    })
    it('Editar Grupo No Existe PATCH /grupo/$Id -> 404', function (done) {
        request(app)
            .patch('/grupo/' + IdNoExiste)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(404)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Unir Grupo Usuario Inactivo POST /grupo/$Id/unir -> 401', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/unir')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Activo Usuario 2 - PATCH /user -> 200', function (done) {
        request(app)
            .patch('/user')
            .query({ full: true })
            .set('authorization', 'Bearer ' + User2.UserToken)
            .send({ nombre: User2.Alias })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body.nombre).to.equal(User2.Alias)
                expect(res.body.estado).to.equal(1)
                done()
            })
    })
    it('Editar Grupo sin tener permiso PATCH /grupo/$Id -> 401', function (done) {
        request(app)
            .patch('/grupo/' + Grupo1._id)
            .send({ nombreLargo: 'nombreLargo', descripcion: 'descripcion' })
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Editar Grupo nombre Ya existe PATCH /grupo/$Id -> 400', function (done) {
        request(app)
            .patch('/grupo/' + Grupo1._id)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ nombre: Grupo2.nombre, descripcion: 'descripcion' })
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Editar Grupo Correcto PATCH /grupo/$Id -> 200', function (done) {
        request(app)
            .patch('/grupo/' + Grupo1._id)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ descripcion: 'DescripcionNueva' })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body.descripcion).to.equal('DescripcionNueva')
                done()
            })
    })
    it('Unir Grupo No Existe POST /grupo/$Id/unir -> 400', function (done) {
        request(app)
            .post('/grupo/' + IdNoExiste + ' /unir')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Unir Grupo ya estas dentro POST /grupo/$Id/unir -> 400', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/unir')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Unir Grupo Correcto POST /grupo/$Id/unir -> 200', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/unir')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dejar Grupo no Existe POST /grupo/$Id/salir -> 400', function (done) {
        request(app)
            .post('/grupo/' + IdNoExiste + ' /salir')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dejar Grupo no estas POST /grupo/$Id/unir -> 400', function (done) {
        request(app)
            .post('/grupo/' + Grupo2._id + '/salir')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dejar Grupo donde eres creador POST /grupo/$Id/salir -> 400', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/salir')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    // Roles
    it('Listar Roles de Grupo No Existe GET /grupo/$Id/rol -> 404', function (done) {
        request(app)
            .get('/grupo/' + IdNoExiste + '/rol')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(404)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Listar Roles de Grupo GET /grupo/$Id/rol -> 200', function (done) {
        request(app)
            .get('/grupo/' + Grupo1._id + '/rol')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dar Rol de Grupo a usuario No Existe POST /grupo/$Id/rol -> 400', function (done) {
        request(app)
            .post('/grupo/' + IdNoExiste + '/rol/' + User2.UserID)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ rol: 'TestRol' })
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dar Rol de Grupo a Usuario No pertenece al Grupo POST /grupo/$Id/rol -> 400', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/rol/' + IdNoExiste)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ rol: 'TestRol' })
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dar Rol de Grupo Incorrecto Usuario POST /grupo/$Id/rol -> 400', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/rol/' + User2.UserID)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ role: 'TestRol' })
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dar Rol de Grupo a Usuario creador del Grupo POST /grupo/$Id/rol -> 400', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/rol/' + User1.UserID)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ rol: 'TestRol' })
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dar Rol de Grupo a Usuario sin ser Creador POST /grupo/$Id/rol -> 401', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/rol/' + User1.UserID)
            .set('authorization', 'Bearer ' + User2.UserToken)
            .send({ rol: 'TestRol' })
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dar Rol de Grupo Creador a Usuario POST /grupo/$Id/rol -> 400', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/rol/' + User2.UserID)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ rol: 'creador' })
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dar Rol de Grupo a Usuario Correcto POST /grupo/$Id/rol -> 200', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/rol/' + User2.UserID)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ rol: 'TestRol' })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dar Rol Delete de Grupo No Existe a Usuario DELETE /grupo/$Id/rol -> 400', function (done) {
        request(app)
            .delete('/grupo/' + IdNoExiste + '/rol/' + User2.UserID)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dar Rol Delete de Grupo a Usuario No pertenece al Grupo DELETE /grupo/$Id/rol -> 400', function (done) {
        request(app)
            .delete('/grupo/' + Grupo1._id + '/rol/' + IdNoExiste)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dar Rol Delete de Grupo a Usuario sin ser creador o moderador DELETE /grupo/$Id/rol -> 401', function (done) {
        request(app)
            .delete('/grupo/' + Grupo1._id + '/rol/' + User1.UserID)
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dar Rol Delete de Grupo a Usuario Creador DELETE /grupo/$Id/rol -> 400', function (done) {
        request(app)
            .delete('/grupo/' + Grupo1._id + '/rol/' + User1.UserID)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dar Rol Delete de Grupo a Usuario correcto DELETE /grupo/$Id/rol -> 200', function (done) {
        request(app)
            .delete('/grupo/' + Grupo1._id + '/rol/' + User2.UserID)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dejar Grupo estando Delete POST /grupo/$Id/salir -> 400', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/salir')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dar Rol user de Grupo a Usuario correcto DELETE /grupo/$Id/rol -> 200', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/rol/' + User2.UserID)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ rol: 'user' })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dejar Grupo Correcto POST /grupo/$Id/salir -> 200', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/salir')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    // SubGrupos
    it('Listar SubGrupos de Grupo No Existe GET /grupo/$Id/subgrupo -> 404', function (done) {
        request(app)
            .get('/grupo/' + IdNoExiste + '/subgrupo')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(404)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Listar SubGrupos de Grupo Corto GET /grupo/$Id/subgrupo -> 200', function (done) {
        request(app)
            .get('/grupo/' + Grupo1._id + '/subgrupo')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body).to.be.an('array')
                expect(res.body).to.have.lengthOf(1)
                expect(res.body[0]).to.equal('Principal')
                done()
            })
    })
    it('Listar SubGrupos de Grupo Completo GET /grupo/$Id/subgrupo -> 200', function (done) {
        request(app)
            .get('/grupo/' + Grupo1._id + '/subgrupo')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .query({ full: true })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body).to.be.an('array')
                expect(res.body).to.have.lengthOf(1)
                expect(res.body[0]).to.have.property('creador')
                done()
            })
    })
    it('Crea SubGrupo de Grupo no existe POST /grupo/$Id/subgrupo -> 400', function (done) {
        request(app)
            .post('/grupo/' + IdNoExiste + '/subgrupo')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ nombre: 'SubGrupo' })
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Crea SubGrupo sin ser Creador POST /grupo/$Id/subgrupo -> 401', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/subgrupo')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .send({ nombre: 'SubGrupo' })
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Crea SubGrupo ya existe incorrecto POST /grupo/$Id/subgrupo -> 400', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/subgrupo')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ nombre: 'Principal' })
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Crea SubGrupo nombre incorrecto POST /grupo/$Id/subgrupo -> 400', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/subgrupo')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ nombre: 'a' })
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Crea SubGrupo Correcto POST /grupo/$Id/subgrupo -> 201', function (done) {
        request(app)
            .post('/grupo/' + Grupo1._id + '/subgrupo')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ nombre: 'SubGrupo' })
            .expect(201)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Modifica SubGrupo No Existe PATCH /grupo/$Id/subgrupo -> 400', function (done) {
        request(app)
            .patch('/grupo/' + Grupo1._id + '/subgrupo/NoExiste')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ nombre: 'SubGrupoNew', estado: 2 })
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Modifica SubGrupo sin ser Creador PATCH /grupo/$Id/subgrupo -> 401', function (done) {
        request(app)
            .patch('/grupo/' + Grupo1._id + '/subgrupo/SubGrupo')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .send({ nombre: 'SubGrupoNew', estado: 2 })
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Modifica SubGrupo Correcto PATCH /grupo/$Id/subgrupo -> 200', function (done) {
        request(app)
            .patch('/grupo/' + Grupo1._id + '/subgrupo/SubGrupo')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ nombre: 'SubGrupoNew', estado: 2 })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Elimina SubGrupo No Existe DELETE /grupo/$Id/subgrupo -> 400', function (done) {
        request(app)
            .delete('/grupo/' + Grupo1._id + '/subgrupo/NoExiste')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Elimina SubGrupo sin ser Creador DELETE /grupo/$Id/subgrupo -> 401', function (done) {
        request(app)
            .delete('/grupo/' + Grupo1._id + '/subgrupo/SubGrupoNew')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Elimina SubGrupo Principal DELETE /grupo/$Id/subgrupo -> 400', function (done) {
        request(app)
            .delete('/grupo/' + Grupo1._id + '/subgrupo/PrincipAL')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Elimina SubGrupo Correcto DELETE /grupo/$Id/subgrupo -> 200', function (done) {
        request(app)
            .delete('/grupo/' + Grupo1._id + '/subgrupo/SubGrupoNew')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })

    it('Borrar Grupo sin ser Creador DELETE /grupo/$GrupoId -> 401', function (done) {
        request(app)
            .delete('/grupo/' + Grupo1._id)
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Borrar Grupo correcto DELETE /grupo/$GrupoId -> 200', function (done) {
        request(app)
            .delete('/grupo/' + Grupo1._id)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                // console.log('BodyFull:', res.body)
                if (err) return done(err)
                done()
            })
    })
    this.afterAll(async function () {
        const UserModel = require('../Models/UserModel')
        const UserDB = new UserModel()
        await UserDB.BorraUsuarioTotalmente(User1.UserID)
        await UserDB.BorraUsuarioTotalmente(User2.UserID)
        const GrupoModel = require('../Models/GrupoModel')
        const GrupoDB = new GrupoModel()
        await GrupoDB.delete(Grupo2._id)
    })
})
