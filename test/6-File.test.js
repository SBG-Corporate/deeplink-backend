/* eslint-disable no-undef */
process.env.VERCEL_ENV = 'test'
const request = require('supertest')
const app = require('../index')
const path = require('path')
// eslint-disable-next-line no-unused-vars
const { expect } = require('chai')
const User1 = { email: 'test@gmail.com', AuthToken: '', UserToken: '', UserID: '', Alias: 'AliasTest' }
const User2 = { email: 'test2@gmail.com', AuthToken: '', UserToken: '', UserID: '', Alias: 'AliasTest2' }
const File1 = { originalName: '', fileId: '', userId: '' }


describe('File Test -> "/file"', function () {
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
        await UserDB.ActualizaUsuario(User2.UserID, { estado: 1, alias: User2.Alias, rol: ['user'] }, true)
    })
    it('Listar todos los Ficheros Subidos GET /file/all sin ser Admin -> 401', function (done) {
        request(app)
            .get('/file/all')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Listar todos los Ficheros Subidos GET /file/all -> 200', function (done) {
        request(app)
            .get('/file/all')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body).to.be.an('array')
                expect(res.body).to.have.lengthOf(0)
                done()
            })
    })
    it('Listar Mis Ficheros Subidos con Token Incorrecto GET /file -> 401', function (done) {
        request(app)
            .get('/file')
            .set('authorization', 'Bearer 1234')
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Listar Mis Ficheros Subidos GET /file -> 200', function (done) {
        request(app)
            .get('/file')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body).to.be.an('array')
                expect(res.body).to.have.lengthOf(0)
                done()
            })
    })
    it('Upload File POST /file sin datos -> 400', function (done) {
        request(app)
            .post('/file')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Upload File POST /file con datos incorrecto -> 400', function (done) {
        request(app)
            .post('/file')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .send({ file: 'Malo' })
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Upload File correcto POST /file -> 201', function (done) {
        this.timeout(5000)
        const filePath = path.join(__dirname, '../Views/Assets/logo192.png')
        request(app)
            .post('/file')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .attach('file', filePath)
            .expect(201)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body.userId).to.equal(User2.UserID)
                File1.originalName = res.body.originalname
                File1.fileId = res.body.fileId
                File1.userId = res.body.userId
                done()
            })
    })
    it('Upload File Duplicado POST /file -> 400', function (done) {
        this.timeout(5000)
        const filePath = path.join(__dirname, '../Views/Assets/logo192.png')
        request(app)
            .post('/file')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .attach('file', filePath)
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Listar Mis Ficheros Subidos GET /file -> 200', function (done) {
        request(app)
            .get('/file')
            .set('authorization', 'Bearer ' + User2.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body).to.be.an('array')
                expect(res.body).to.have.lengthOf(1)
                expect(res.body[0].fileId).to.equal(File1.fileId)
                done()
            })
    })
    it('Listar todos los Ficheros Subidos GET /file/all -> 200', function (done) {
        request(app)
            .get('/file/all')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body).to.be.an('array')
                expect(res.body).to.have.lengthOf(1)
                expect(res.body[0].fileId).to.equal(File1.fileId)
                done()
            })
    })
    it('Listar Mis Ficheros Subidos GET /file -> 200', function (done) {
        request(app)
            .get('/file')
            .set('authorization', 'Bearer ' + User1.UserToken)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body).to.be.an('array')
                expect(res.body).to.have.lengthOf(0)
                done()
            })
    })
    it('Delete File DELETE /file/$Id -> 200', function (done) {
        request(app)
            .delete('/file/' + File1.fileId)
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
