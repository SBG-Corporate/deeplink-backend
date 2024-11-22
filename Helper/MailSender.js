const ConfigData = require('../Config/config')
const DebugSend = require('../Helper/debug')
const nodemailer = require('nodemailer')

async function SendEmail (_To, _Subject, _Msg) {
    if (ConfigData.ServEmail.host === 'gmail.com') {
        return await SendEmailGMAIL(_To, _Subject, _Msg)
    } else {
        return await SendEmailSMTP(_To, _Subject, _Msg)
    }
}

async function SendEmailSMTP (_To, _Subject, _Msg) {
    const from = ConfigData.ServEmail.user + '@' + ConfigData.ServEmail.host
    const transporter = nodemailer.createTransport({
        host: ConfigData.ServEmail.host,
        port: ConfigData.ServEmail.port,
        secure: false,
        auth: { user: from, pass: ConfigData.ServEmail.pass, type: 'login' },
        tls: { rejectUnauthorized: false }
    })
    const mailOptions = {
        from,
        to: _To,
        subject: _Subject,
        text: _Msg.text,
        html: _Msg.html
    }
    try {
        await transporter.sendMail(mailOptions)
        DebugSend('Email enviado por SMTP')
        return true
    } catch (err) {
        DebugSend('Fallo envio Email por SMTP:', err)
        return false
    }
}

async function SendEmailGMAIL (_To, _Subject, _Msg) {
    const from = ConfigData.ServEmail.user + '@' + ConfigData.ServEmail.host

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: ConfigData.ServEmail.user, pass: ConfigData.ServEmail.pass }
    })
    const mailOptions = {
        from,
        to: _To,
        subject: _Subject,
        text: _Msg.text,
        html: _Msg.html
    }
    try {
        const Resp = await transporter.sendMail(mailOptions)
        DebugSend('Email enviado por GMAIL')
        return { Status: 'Email enviado por GMAIL', Resp }
    } catch (err) {
        DebugSend('Fallo envio Email por GMAIL:', err)
        return false
    }
}

module.exports = SendEmail
