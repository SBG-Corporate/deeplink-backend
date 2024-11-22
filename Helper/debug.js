const ConfigData = require('../Config/config')

function DebugSend (...args) {
    if (!ConfigData.IsProduction) { console.log(...args) }
}

module.exports = DebugSend
