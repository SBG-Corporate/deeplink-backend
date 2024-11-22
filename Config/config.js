const GetEntorno = () => {
    const entorno = process.env.VERCEL_ENV
    if (entorno === 'test' || entorno === 'local') {
        return entorno
    } else if (entorno === 'development' || entorno === 'preview') {
        return 'dev'
    } else if (entorno === 'production') {
        return 'prod'
    } else {
        return 'local'
    }
}

const Entorno = GetEntorno()
const ConfigData = {
    entorno: Entorno,
    NombreDB: (Entorno === 'prod') ? process.env.NombreDB : process.env.NombreDB + '_' + Entorno,
    ConfigDB: {
        aws: process.env.AWS ? JSON.parse(process.env.AWS) : null,
        mongo: process.env.MongoDB ? JSON.parse(process.env.MongoDB) : null,
        mysql: process.env.MySql ? JSON.parse(process.env.MySql) : null
    },
    port: process.env.PORT || 5000,
    url: (Entorno === 'prod') ? 'https://' + process.env.VERCEL_URL : 'http://' + process.env.VERCEL_URL + ':' + process.env.PORT,
    IsProduction: (Entorno === 'prod'),
    ConfigKeys: process.env.ConfigKeys ? JSON.parse(process.env.ConfigKeys) : null,
    ServEmail: process.env.ServEmail ? JSON.parse(process.env.ServEmail) : null,
    FrontUrl: process.env.FrontUrl
}

module.exports = ConfigData
