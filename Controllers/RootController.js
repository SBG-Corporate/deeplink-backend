function Root (req, res) {
    res.send()
}

function Ping (req, res) {
    res.json({ data: 'pong' })
}

function FavIcon (req, res) {
    const path = require('path')
    res.sendFile(path.join(__dirname, '../Views/Assets/favicon.ico'))
}

module.exports = {
    Root,
    Ping,
    FavIcon
}
