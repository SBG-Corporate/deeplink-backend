const CuerpoEmail = `
<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8" name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeepLink - Login</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 16px;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    h1 {
      text-align: center;
      margin-top: 0;
    }
    p {
      text-align: center;
    }

    a.button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      transition: background-color 0.2s;
    }

    a.button:hover {
      background-color: #2E8B57;
    }

    .login-url {
      margin-top: 20px;
      text-align: center;
    }
  </style>
</head>

<body>
  <h1>¡Bienvenido a DeepLink!</h1>
  <center>
    <p>Por favor haga clic en el siguiente enlace para acceder a su cuenta:</p>
    <a href="{{URL}}" class="button">Iniciar sesión en DeepLink</a>
    <p class="login-url">Si tiene problemas para acceder a su cuenta, puede ingresar directamente en la URL de inicio de
      sesión:<br><a href="{{URL}}">{{URL}}</a></p>
    <p>Si tiene alguna pregunta o necesita ayuda, por favor envíe un correo electrónico a nuestro equipo de soporte en
      <a href="mailto:{{CORREO}}">{{CORREO}}</a>.
    </p>
  </center>
</body>

</html>
`
module.exports = CuerpoEmail
