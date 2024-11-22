function GenerateSubject (_Lang = 'es') {
    return _Lang === 'es' ? 'Activa tu cuenta en DeepLink' : 'Activate your account on DeepLink'
}

function GenerateMSG (_Url, _Correo, _Lang = 'es') {
    const text = _Lang === 'es' ? 'Para acceder a su cuenta, Puede ingresar directamente en la URL de inicio de sesión: ' + _Url : 'To access your account, you can directly enter the login URL: ' + _Url
    const html = GenerateHTML(_Url, _Correo, _Lang)
    return { text, html }
}

function GenerateHTML (url, correo, _Lang = 'es') {
    let html = _Lang === 'es'
        ? require('./es_email')
        : require('./en_email')
    html = html.replace(/{{URL}}/g, url)
    html = html.replace(/{{CORREO}}/g, correo)
    return html
}

module.exports = {
    GenerateMSG,
    GenerateHTML,
    GenerateSubject
}
