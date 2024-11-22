const ConfigData = require('../Config/config')

function GeneraParClaves () {
    const crypto = require('crypto')

    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
    const publicKeyPEM = publicKey.export({ type: 'spki', format: 'pem' })
    const privateKeyPEM = privateKey.export({ type: 'pkcs8', format: 'pem' })

    return { publicKeyPEM, privateKeyPEM }
}

function Encrypt (Texto, TempIv = null) {
    const CryptoJS = require('crypto-js')
    const EncryptKey = ConfigData.ConfigKeys.EncryptKey
    const ivHex = CryptoJS.SHA3(String((TempIv || EncryptKey)).toLocaleUpperCase().split('').reverse().join('')).toString()
    const encrypted = CryptoJS.AES.encrypt(Texto, EncryptKey, { iv: ivHex, mode: CryptoJS.mode.CBC })
    return encrypted.toString()
}

function Decrypt (Texto, TempIv = null) {
    const CryptoJS = require('crypto-js')
    const EncryptKey = ConfigData.ConfigKeys.EncryptKey
    const ivHex = CryptoJS.SHA3(String((TempIv || EncryptKey)).toLocaleUpperCase().split('').reverse().join('')).toString()
    const decrypted = CryptoJS.AES.decrypt(Texto, EncryptKey, { iv: CryptoJS.enc.Hex.parse(ivHex), mode: CryptoJS.mode.CBC })
    return decrypted.toString(CryptoJS.enc.Utf8)
}

module.exports = {
    GeneraParClaves,
    Encrypt,
    Decrypt
}
