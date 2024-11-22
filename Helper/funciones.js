function getTimeStamp (period = null) {
    let timestamp = new Date().getTime()
    if (period === null) return timestamp.toString()
    const timeRegex = /^(\d+)([mhd])$/
    const match = period.match(timeRegex)

    if (match) {
        const amount = parseInt(match[1])
        const unit = match[2]

        switch (unit) {
            case 'm':
                timestamp += amount * 60 * 1000
                break
            case 'h':
                timestamp += amount * 60 * 60 * 1000
                break
            case 'd':
                timestamp += amount * 24 * 60 * 60 * 1000
                break
            default:
                throw new Error(`Invalid time unit: ${unit}`)
        }
    } else {
        throw new Error(`Invalid time period format: ${period}`)
    }
    return timestamp.toString()
}

function getNormaliceTimeStamp (TimeStamp) {
    return new Date(Number(TimeStamp)).toString().toLocaleString()
}

function timestampValido (timestamp, Minutos) {
    const ahora = new Date()
    const fechaTimestamp = new Date(timestamp)
    const diferenciaEnMinutos = Math.floor((ahora - fechaTimestamp) / (1000 * 60))
    return diferenciaEnMinutos < Minutos
}

function generateId () {
    const unixTimestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0')
    const processUniqueValue = generateRandomHex(6)
    const randomValue = generateRandomHex(4)
    const incrementingCounter = generateRandomHex(6)

    return unixTimestamp + processUniqueValue + randomValue + incrementingCounter
}

function generateRandomHex (length) {
    let result = ''
    const chars = '0123456789abcdef'

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length)
        result += chars.charAt(randomIndex)
    }

    return result
}

function RamdomNumber (min, max) {
    return Math.floor(Math.random() * (max - min)) + min
}

module.exports = {
    getTimeStamp,
    getNormaliceTimeStamp,
    timestampValido,
    generateId,
    RamdomNumber
}
