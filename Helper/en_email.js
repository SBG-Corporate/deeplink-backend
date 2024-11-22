const CuerpoEmail = `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeepLink - Iniciar sesión</title>
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
  <h1>Welcome to DeepLink!</h1>
  <center>
    <p>Please click the following link to access your account:</p>
    <a href="{{URL}}" class="button">Login to DeepLink</a>
    <p class="login-url">If you're having trouble accessing your account, you can also sign in directly at the login URL:<br><a href="{{URL}}">{{URL}}</a></p>
    <p>If you have any questions or need assistance, please email our support team at <a href="mailto:{{CORREO}}">{{CORREO}}</a>.</p>
  </center>
</body>
</html>
`
module.exports = CuerpoEmail
