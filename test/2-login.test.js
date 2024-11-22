/* eslint-disable no-undef */
process.env.VERCEL_ENV = 'test'
const request = require('supertest')
const app = require('../index')
const { expect } = require('chai')
const TestEmail = 'test@gmail.com'
let AuthToken = ''

describe('Login Test -> "/login"', function () {
    it('Ruta que NO existe - GET /login/NoExiste -> 404', function (done) {
        request(app)
            .get('/login/NoExiste')
            .expect(404)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })

    it('Login Sin Datos - POST /login -> 400', function (done) {
        request(app)
            .post('/login')
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })

    it('Login Datos Incorrectos - POST /login -> 400', function (done) {
        request(app)
            .post('/login')
            .send({ email: 'test' })
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })

    it('Login Correcto - POST /login -> 200', function (done) {
        request(app)
            .post('/login')
            .send({ email: TestEmail, idioma: 'es', ModoPrueba: true })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body).to.have.property('data')
                expect(res.body).to.have.property('token')
                AuthToken = res.body.token
                done()
            })
    })

    it('Auth Datos Incorrectos - POST /login/auth -> 400', function (done) {
        request(app)
            .post('/login/auth')
            .send({ emails: TestEmail })
            .send({ token: AuthToken })
            .expect(400)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })

    it('Auth Token Incorrecto - POST /login/auth -> 401', function (done) {
        request(app)
            .post('/login/auth')
            .send({ email: TestEmail })
            .send({ token: 'TestEmail' })
            .expect(401)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })

    it('Auth Correcto - POST /login/auth -> 200 o 201', function (done) {
        request(app)
            .post('/login/auth')
            .send({ email: TestEmail })
            .send({ token: AuthToken })
            .expect(function (res) {
                if (res.status !== 200 && res.status !== 201) {
                    throw new Error('Código de estado incorrecto')
                }
            })
            .end(function (err, res) {
                if (err) return done(err)
                expect(res.body).to.have.property('account')
                expect(res.body).to.have.property('token')
                expect(res.body).to.have.property('expire')
                done()
            })
    })
})
