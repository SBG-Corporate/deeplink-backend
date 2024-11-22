/* eslint-disable no-undef */
process.env.VERCEL_ENV = 'test'
const request = require('supertest')
const app = require('../index')
const { expect } = require('chai')
const User1 = { email: 'test@gmail.com', AuthToken: '', UserToken: '', UserID: '', Alias: 'AliasTest' }
const User2 = { email: 'test2@gmail.com', AuthToken: '', UserToken: '', UserID: '', Alias: 'AliasTest2' }

describe('Gestion Test -> "/gestion"', function () {
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
    it('Quitar Rol a Usuario DELETE /gestion/rol/$UserId -> 200', function (done) {
        request(app)
            .delete('/gestion/rol/' + User2.UserID)
            .set('authorization', 'Bearer ' + User1.UserToken)
            .send({ rol: 'admin' })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Listar Roles de Usuarios sin permiso GET /gestion/rol -> 401', function (done) {
        request(app)
            .get('/gestion/rol')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Listar Roles de Usuarios GET /gestion/rol -> 200', function (done) {
        request(app)
            .get('/gestion/rol')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Listar Rol admin sin permiso GET /gestion/rol/admin -> 401', function (done) {
        request(app)
            .get('/gestion/rol/admin')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Listar Rol admin GET /gestion/rol/admin -> 200', function (done) {
        request(app)
            .get('/gestion/rol/admin')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Listar todos los usuarios sin permiso GET /gestion/user -> 401', function (done) {
        request(app)
            .get('/gestion/user')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Listar todos los usuarios GET /gestion/user -> 200', function (done) {
        request(app)
            .get('/gestion/user')
            .query({ full: true })
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Ver usuario sin permiso GET /gestion/user/$UserId -> 401', function (done) {
        request(app)
            .get('/gestion/user/' + User1.UserID)
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Ver usuario GET /gestion/user/$UserId -> 200', function (done) {
        request(app)
            .get('/gestion/user/' + User2.UserID)
            .query({ full: true })
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Cambiar Estado usuario sin permiso GET /gestion/estado/:_id/:estado -> 401', function (done) {
        request(app)
            .post('/gestion/estado/' + User1.UserID + '/2')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Cambiar Estado usuario GET /gestion/estado/:_id/:estado -> 200', function (done) {
        request(app)
            .post('/gestion/estado/' + User2.UserID + '/2')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body.estado).to.equal(2)
                done()
            })
    })
    it('Dar Rol moderador a Usuario sin permiso POST /gestion/rol/$UserId -> 401', function (done) {
        request(app)
            .post('/gestion/rol/' + User1.UserID)
            .send({ rol: 'moderador' })
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Dar Rol moderador a Usuario POST /gestion/rol/$UserId -> 200', function (done) {
        request(app)
            .post('/gestion/rol/' + User2.UserID)
            .send({ rol: 'moderador' })
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Editar Nombre Usuario sin permiso Admin PATCH /gestion/user/$UserId -> 401', function (done) {
        request(app)
            .patch('/gestion/user/' + User1.UserID)
            .send({ nombre: 'Prueba' })
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Editar Nombre Usuario  PATCH /gestion/user/$UserId -> 200', function (done) {
        request(app)
            .patch('/gestion/user/' + User2.UserID)
            .send({ nombre: 'Prueba' })
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body.nombre).to.equal('Prueba')
                done()
            })
    })
    it('Listar todos los usuarios siendo Moderador GET /gestion/user -> 200', function (done) {
        request(app)
            .get('/gestion/user')
            .query({ full: true })
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
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
