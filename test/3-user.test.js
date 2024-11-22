/* eslint-disable no-undef */
process.env.VERCEL_ENV = 'test'
const request = require('supertest')
const app = require('../index')
const { expect } = require('chai')
const User1 = { email: 'test@gmail.com', AuthToken: '', UserToken: '', UserID: '', Alias: 'AliasTest' }
const User2 = { email: 'test2@gmail.com', AuthToken: '', UserToken: '', UserID: '', Alias: 'AliasTest2' }

describe('User Test -> "/user"', function () {
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
    it('Get Usuario Token Incorrecto - GET /user -> 401', function (done) {
        request(app)
            .get('/user')
            .set('authorization', 'Bearer 1234')
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })

    it('Get Usuario Correcto - GET /user -> 200', function (done) {
        request(app)
            .get('/user')
            .query({ full: true })
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body.usuario).to.equal(User1.email)
                expect(res.body.estado).to.equal(0)
                done()
            })
    })

    it('Update Usuario Correcto Sin Activar - PATCH /user -> 200', function (done) {
        request(app)
            .patch('/user')
            .query({ full: true })
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ alias: User1.Alias })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body.estado).to.equal(0)
                expect(res.body.alias).to.equal(User1.Alias)
                done()
            })
    })
    it('Añadir Amigo Sin Estar Activado - POST /user/amigo/$UserID2 -> 401', function (done) {
        request(app)
            .post('/user/amigo/' + User2.UserID)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Update Usuario Correcto Activando - PATCH /user -> 200', function (done) {
        request(app)
            .patch('/user')
            .query({ full: true })
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ nombre: 'NombreTest' })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body.nombre).to.equal('NombreTest')
                expect(res.body.estado).to.equal(1)
                done()
            })
    })
    it('Listar Alias - GET /user/alias -> 200', function (done) {
        request(app)
            .get('/user/alias')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body).to.have.property(User1.Alias.toLowerCase())
                done()
            })
    })
    it('Listar Alias - GET /user/alias/NoExiste -> 404', function (done) {
        request(app)
            .get('/user/alias/NoExiste')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(404)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body.existe).to.equal(false)
                done()
            })
    })
    it('Listar Alias - GET /user/alias/AliasTest -> 200', function (done) {
        request(app)
            .get('/user/alias/' + User1.Alias)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body.existe).to.equal(true)
                expect(res.body.alternativos).to.be.an('array')
                expect(res.body.alternativos).to.have.lengthOf(10)
                expect(res.body).to.have.property('_id')
                done()
            })
    })
    it('Añadir Amigo a mi mismo - POST /user/amigo/$UserID -> 400', function (done) {
        request(app)
            .post('/user/amigo/' + User1.UserID)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Añadir Amigo Correcto - POST /user/amigo/$UserID2 -> 200', function (done) {
        request(app)
            .post('/user/amigo/' + User2.UserID)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body.amigos).to.be.an('array')
                expect(res.body.amigos).to.have.lengthOf(1)
                done()
            })
    })
    it('Listar Amigos Corto - GET /user/amigo -> 200', function (done) {
        request(app)
            .get('/user/amigo')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body).to.be.an('array')
                expect(res.body).to.have.lengthOf(1)
                expect(res.body[0]).to.equal(User2.UserID)
                done()
            })
    })
    it('Listar Amigos Largo - GET /user/amigo -> 200', function (done) {
        request(app)
            .get('/user/amigo')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .query({ full: true })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body).to.be.an('array')
                expect(res.body).to.have.lengthOf(1)
                expect(res.body[0]._id).to.equal(User2.UserID)
                done()
            })
    })
    it('Quitar Amigo No Existe - DELETE /user/amigo/$UserID -> 400', function (done) {
        request(app)
            .delete('/user/amigo/' + User1.UserID)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Quitar Amigo Correcto - DELETE /user/amigo/$UserID2 -> 200', function (done) {
        request(app)
            .delete('/user/amigo/' + User2.UserID)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Listar Amigos Vacio - GET /user/amigo -> 200', function (done) {
        request(app)
            .get('/user/amigo')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body).to.be.an('array')
                expect(res.body).to.have.lengthOf(0)
                done()
            })
    })
    this.afterAll(async function () {
        const UserModel = require('../Models/UserModel')
        const UserDB = new UserModel()
        await UserDB.BorraUsuarioTotalmente(User1.UserID)
        await UserDB.BorraUsuarioTotalmente(User2.UserID)
    })
})
