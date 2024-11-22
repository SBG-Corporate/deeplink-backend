/* eslint-disable no-undef */
process.env.VERCEL_ENV = 'test'
const request = require('supertest')
const app = require('../index')
const { expect } = require('chai')

describe('Root Test -> "/"', function () {
    this.beforeAll(function () {

    })
    it('Ruta que NO existe - GET /NoExiste -> 404', function (done) {
        request(app)
            .get('/NoExiste')
            .expect(404)
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Ruta para Monitorizacion - GET /ping -> 200 { data: "pong" }', function (done) {
        request(app)
            .get('/ping')
            .expect(200)
            .expect('Content-Type', /json/)
            .expect({ data: 'pong' })
            .end(function (err, res) {
                if (err) return done(err)
                done()
            })
    })
    it('Ruta Favicon - GET /favicon.ico', function (done) {
        request(app)
            .get('/favicon.ico')
            .expect(200)
            .expect('Content-Type', 'image/x-icon')
            .end((err, res) => {
                if (err) return done(err)
                expect(res.body).to.be.an.instanceof(Buffer)
                done()
            })
    })
    this.afterAll(function () {
        // console.log('Root Test -> afterAll')
    })
})
