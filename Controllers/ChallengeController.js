const ErrorSend = require('../Helper/errores')
const { GetTokenText } = require('../Middleware/AuthMiddleware')
const ChallengeModel = require('../Models/ChallengeModel')
const ChallengeDB = new ChallengeModel()
const UserModel = require('../Models/UserModel')
const UserDB = new UserModel()
const MsgModel = require('../Models/MsgModel')
const MsgDB = new MsgModel()

async function GetAllChallenges (req, res) {
  try {
    const UserId = GetTokenText(req)._id
    const Usuario = await UserDB.read(UserId)
    if (!Usuario) { return ErrorSend(res, 404, 'No se ha encontrado el usuario') }

    const FilteredChallenges = await ChallengeDB.GetAll(Usuario)
    if (!FilteredChallenges || FilteredChallenges.length === 0) {
      return ErrorSend(res, 404, 'No se han encontrado Challenges');
    }
    return res.json(FilteredChallenges);
  } catch (err) {
    return ErrorSend(res, 500, err.message);
  }
}

async function CreateChallenge (req, res) {
  const { name, description, slug, reward, challengeType, challengeTarget } = req.body
  try {
    if (!reward || reward <= 0) {
      return ErrorSend(res, 400, 'Tiene que haber recompensa')
    }
    if (challengeType !== "likesInPostsGiven" &&
      challengeType !== "likesInArticlesGiven" &&
      challengeType !== "likesInCommentsGiven" &&
      challengeType !== "totalLikesGiven" &&

      challengeType !== "likesInPostsReceived" &&
      challengeType !== "likesInArticlesReceived" &&
      challengeType !== "likesInCommentsReceived" &&
      challengeType !== "totalLikesReceived" &&

      challengeType !== "commentsInPostsGiven" &&
      challengeType !== "commentsInArticlesGiven" &&
      challengeType !== "totalCommentsGiven" &&
      challengeType !== "commentsInPostsReceived" &&
      challengeType !== "commentsInArticlesReceived" &&
      challengeType !== "totalCommentsReceived" &&

      challengeType !== "viewsInPosts" &&
      challengeType !== "viewsInArticles" &&
      challengeType !== "following" &&
      challengeType !== "followers" &&
      challengeType !== "totalPosts" &&
      challengeType !== "totalArticles"
    ) {
      return ErrorSend(res, 400, 'El tipo de challenge no es correcto')
    }
    const CheckSlug = await ChallengeDB.CheckSlugsInChallenges(req.body.slug)
    if (CheckSlug.existe) { return ErrorSend(res, 400, { msg: CheckSlug.msg }) }
    const NewData = {
      nombre: name,
      descripcion: description,
      slug,
      recompensa: reward,
      creador: GetTokenText(req)._id,
      tipoDeChallenge: challengeType,
      objetivoDeChallenge: challengeTarget,
    }
    const NewChallenge = await ChallengeDB.RegistraChallenge(NewData)
    return res.status(201).json(NewChallenge)
  } catch (err) {
    return ErrorSend(res, 500, err.message)
  }
}

async function UpdateChallenge (req, res) {
  try {
    const FULL = !!(req.query.full)
    // checkeamos que el slug sea único solo si se quiere cambiar
    if (req.body.slug) {
      const CheckSlug = await ChallengeDB.CheckSlugsInChallenges(req.body.slug)
      if (CheckSlug.existe) return ErrorSend(res, 400, { msg: CheckSlug.msg })
    }
    if (req.body.order <= 0) {
      return ErrorSend(res, 400, { msg: "Order tiene que ser positivo" })
    }
    const ParsedData = {
      nombre: req.body.name,
      descripcion: req.body.description,
      slug: req.body.slug,
      recompensa: req.body.reward,
      tipoDeChallenge: req.body.challengeType,
      objetivoDeChallenge: req.body.challengeTarget,
      order: req.body.order,
    }
    const Challenge = await ChallengeDB.ActualizaChallenge(req.params._id, ParsedData)
    return (Challenge) ? res.json(ChallengeDB.Parse(Challenge, FULL)) : ErrorSend(res, 404, 'No se ha encontrado el challenge')
  } catch (err) {
    return ErrorSend(res, 500, err.message)
  }
}

async function DeleteChallenge (req, res) {
  try {
    const ChallengeId = req.params._id
    const Resp = await ChallengeDB.BorraChallenge(ChallengeId)
    if (!Resp) return ErrorSend(res, 400, 'No hay challenge con ese Id')
    return res.json(Resp)
  } catch (err) {
    return ErrorSend(res, 500, err.message)
  }
}


async function ValidateChallenge (req, res) {
  try {
    const UserId = GetTokenText(req)._id
    const Usuario = await UserDB.read(UserId)
    if (!Usuario) { return ErrorSend(res, 404, 'No se ha encontrado el usuario') }
    const ChallengeId = req.params._id
    const Challenge = await ChallengeDB.read(ChallengeId)
    if (!Challenge) { return ErrorSend(res, 404, 'No se ha encontrado el challenge') }
    const Mensajes = await MsgDB.readAll()
    if (!Challenge.isEnabled) { return ErrorSend(res, 404, 'El challenge no está activo') }
    let IsValidated = false
    let PuntosDeChallenge = 0

    // Likes given
    if (Challenge.tipoDeChallenge === "likesInPostsGiven") {
      PuntosDeChallenge = await ChallengeDB.GetGivenLikesInMsg(Usuario, Mensajes, "post")
    }
    if (Challenge.tipoDeChallenge === "likesInArticlesGiven") {
      PuntosDeChallenge = await ChallengeDB.GetGivenLikesInMsg(Usuario, Mensajes, "noticia")
    }
    if (Challenge.tipoDeChallenge === "likesInCommentsGiven") {
      PuntosDeChallenge = await ChallengeDB.GetGivenLikesInMsgComments(Usuario, Mensajes)
    }
    if (Challenge.tipoDeChallenge === "totalLikesGiven") {
      PuntosDeChallenge = await ChallengeDB.GetGivenLikesInMsg(Usuario, Mensajes, "noticia")
      PuntosDeChallenge += await ChallengeDB.GetGivenLikesInMsg(Usuario, Mensajes, "post")
      PuntosDeChallenge += await ChallengeDB.GetGivenLikesInMsgComments(Usuario, Mensajes)
    }

    // Likes received
    if (Challenge.tipoDeChallenge === "likesInPostsReceived") {
      PuntosDeChallenge = await ChallengeDB.GetReceivedLikesInMsg(Usuario, Mensajes, "post")
    }
    if (Challenge.tipoDeChallenge === "likesInArticlesReceived") {
      PuntosDeChallenge = await ChallengeDB.GetReceivedLikesInMsg(Usuario, Mensajes, "noticia")
    }
    if (Challenge.tipoDeChallenge === "likesInCommentsReceived") {
      PuntosDeChallenge = await ChallengeDB.GetReceivedLikesInMsgComments(Usuario, Mensajes)
    }
    if (Challenge.tipoDeChallenge === "totalLikesReceived") {
      PuntosDeChallenge = await ChallengeDB.GetReceivedLikesInMsg(Usuario, Mensajes, "noticia")
      PuntosDeChallenge += await ChallengeDB.GetReceivedLikesInMsg(Usuario, Mensajes, "post")
      PuntosDeChallenge += await ChallengeDB.GetReceivedLikesInMsgComments(Usuario, Mensajes)
    }

    // Comments gived
    if (Challenge.tipoDeChallenge === "commentsInPostsGiven") {
      PuntosDeChallenge = await ChallengeDB.GetGivenCommentsInMsg(Usuario, Mensajes, "post")
    }
    if (Challenge.tipoDeChallenge === "commentsInArticlesGiven") {
      PuntosDeChallenge = await ChallengeDB.GetGivenCommentsInMsg(Usuario, Mensajes, "noticia")
    }
    if (Challenge.tipoDeChallenge === "totalCommentsGiven") {
      PuntosDeChallenge = await ChallengeDB.GetGivenCommentsInMsg(Usuario, Mensajes, "post")
      PuntosDeChallenge += await ChallengeDB.GetGivenCommentsInMsg(Usuario, Mensajes, "noticia")
    }

    // Comments received
    if (Challenge.tipoDeChallenge === "commentsInPostsReceived") {
      PuntosDeChallenge = await ChallengeDB.GetReceivedCommentsInMsg(Usuario, Mensajes, "post")
    }
    if (Challenge.tipoDeChallenge === "commentsInArticlesReceived") {
      PuntosDeChallenge = await ChallengeDB.GetReceivedCommentsInMsg(Usuario, Mensajes, "noticia")
    }
    if (Challenge.tipoDeChallenge === "totalCommentsReceived") {
      PuntosDeChallenge += await ChallengeDB.GetReceivedCommentsInMsg(Usuario, Mensajes, "post")
      PuntosDeChallenge += await ChallengeDB.GetReceivedCommentsInMsg(Usuario, Mensajes, "noticia")
    }

    // Views
    if (Challenge.tipoDeChallenge === "viewsInPosts") {
      PuntosDeChallenge = await ChallengeDB.GetReceivedViewsInMsg(Usuario, Mensajes, "post")
    }
    if (Challenge.tipoDeChallenge === "viewsInArticles") {
      PuntosDeChallenge = await ChallengeDB.GetReceivedViewsInMsg(Usuario, Mensajes, "noticia")
    }

    //Following, followers
    if (Challenge.tipoDeChallenge === "following") {
      PuntosDeChallenge = Usuario.amigos.length
    }
    if (Challenge.tipoDeChallenge === "followers") {
      const Usuarios = await UserDB.readAll()
      PuntosDeChallenge = await ChallengeDB.GetFollowerUsers(Usuario, Usuarios)
    }

    // Articulos y posts totales
    if (Challenge.tipoDeChallenge === "totalPosts") {
      PuntosDeChallenge = await ChallengeDB.GetTotalMsgOwnedOfAType(Usuario, Mensajes, "post")
    }
    if (Challenge.tipoDeChallenge === "totalArticles") {
      PuntosDeChallenge = await ChallengeDB.GetTotalMsgOwnedOfAType(Usuario, Mensajes, "noticia")
    }

    if (PuntosDeChallenge >= Challenge.objetivoDeChallenge) { IsValidated = true }
    else { IsValidated = false }

    if (IsValidated) {
      const NewUser = await UserDB.AñadeChallengeCumplido(UserId, ChallengeId, Challenge.recompensa)
      if (NewUser === null) {
        return ErrorSend(res, 406, 'Este challenge ya ha sido validado por el usuario')
      } else {
        return res.status(200).json(NewUser)
      }
    } else {
      return ErrorSend(res, 400, `No se cumplen los requisitos para aprovar el challenge, llevas: ${PuntosDeChallenge}`)
    }

  } catch (err) {
    return ErrorSend(res, 500, err.message)
  }

}

async function CheckAllChallenges (req, res) {
  try {
    const UserId = GetTokenText(req)._id
    const Usuario = await UserDB.read(UserId)
    if (!Usuario) { return ErrorSend(res, 404, 'No se ha encontrado el usuario') }
    const Challenges = await ChallengeDB.readAll()
    if (!Challenges) { return ErrorSend(res, 404, 'No se han encontrado Challenges') }
    const Mensajes = await MsgDB.readAll()
    const SortedChallenges = Challenges.sort((a, b) => a.order - b.order);

    const result = await Promise.all(SortedChallenges.map(async (Challenge) => {
      let PuntosDeChallenge = 0
      const challengeValidationFunctions = {
        "likesInPostsGiven": () => ChallengeDB.GetGivenLikesInMsg(Usuario, Mensajes, "post"),
        "likesInArticlesGiven": () => ChallengeDB.GetGivenLikesInMsg(Usuario, Mensajes, "noticia"),
        "likesInCommentsGiven": () => ChallengeDB.GetGivenLikesInMsgComments(Usuario, Mensajes),
        "totalLikesGiven": async () => {
          let puntos = await ChallengeDB.GetGivenLikesInMsg(Usuario, Mensajes, "noticia")
          puntos += await ChallengeDB.GetGivenLikesInMsg(Usuario, Mensajes, "post")
          puntos += await ChallengeDB.GetGivenLikesInMsgComments(Usuario, Mensajes)
          return puntos
        },
        "likesInPostsReceived": () => ChallengeDB.GetReceivedLikesInMsg(Usuario, Mensajes, "post"),
        "likesInArticlesReceived": () => ChallengeDB.GetReceivedLikesInMsg(Usuario, Mensajes, "noticia"),
        "likesInCommentsReceived": () => ChallengeDB.GetReceivedLikesInMsgComments(Usuario, Mensajes),
        "totalLikesReceived": async () => {
          let puntos = await ChallengeDB.GetReceivedLikesInMsg(Usuario, Mensajes, "noticia")
          puntos += await ChallengeDB.GetReceivedLikesInMsg(Usuario, Mensajes, "post")
          puntos += await ChallengeDB.GetReceivedLikesInMsgComments(Usuario, Mensajes)
          return puntos
        },
        "commentsInPostsGiven": () => ChallengeDB.GetGivenCommentsInMsg(Usuario, Mensajes, "post"),
        "commentsInArticlesGiven": () => ChallengeDB.GetGivenCommentsInMsg(Usuario, Mensajes, "noticia"),
        "totalCommentsGiven": async () => {
          let puntos = await ChallengeDB.GetGivenCommentsInMsg(Usuario, Mensajes, "post")
          puntos += await ChallengeDB.GetGivenCommentsInMsg(Usuario, Mensajes, "noticia")
          return puntos
        },
        "commentsInPostsReceived": () => ChallengeDB.GetReceivedCommentsInMsg(Usuario, Mensajes, "post"),
        "commentsInArticlesReceived": () => ChallengeDB.GetReceivedCommentsInMsg(Usuario, Mensajes, "noticia"),
        "totalCommentsReceived": async () => {
          let puntos = await ChallengeDB.GetReceivedCommentsInMsg(Usuario, Mensajes, "post")
          puntos += await ChallengeDB.GetReceivedCommentsInMsg(Usuario, Mensajes, "noticia")
          return puntos
        },
        "viewsInPosts": () => ChallengeDB.GetReceivedViewsInMsg(Usuario, Mensajes, "post"),
        "viewsInArticles": () => ChallengeDB.GetReceivedViewsInMsg(Usuario, Mensajes, "noticia"),
        "following": () => Promise.resolve(Usuario.amigos.length),
        "followers": async () => {
          const Usuarios = await UserDB.readAll()
          return ChallengeDB.GetFollowerUsers(Usuario, Usuarios)
        },
        "totalPosts": () => ChallengeDB.GetTotalMsgOwnedOfAType(Usuario, Mensajes, "post"),
        "totalArticles": () => ChallengeDB.GetTotalMsgOwnedOfAType(Usuario, Mensajes, "noticia")
      }

      if (challengeValidationFunctions[Challenge.tipoDeChallenge]) {
        PuntosDeChallenge = await challengeValidationFunctions[Challenge.tipoDeChallenge]()
      }
      const isClaimeable = PuntosDeChallenge >= Challenge.objetivoDeChallenge
      return {
        tipoDeChallenge: Challenge.tipoDeChallenge,
        isClaimeable,
        PuntosDeChallenge,
      }
    }))

    return res.json(result)

  } catch (err) {
    return ErrorSend(res, 500, err.message)
  }
}

async function ToggleEnableChallenge (req, res) {
  try {
    const ChallengeId = req.params._id
    const UpdatedChallenge = await ChallengeDB.AlternaEnable(ChallengeId)
    if (!UpdatedChallenge) {
      return ErrorSend(res, 400, 'Challenge not updated')
    }
    return res.json(UpdatedChallenge)
  } catch (err) {
    return ErrorSend(res, 500, err.message)
  }
}

module.exports = {
  GetAllChallenges,
  ValidateChallenge,
  CreateChallenge,
  UpdateChallenge,
  DeleteChallenge,
  CheckAllChallenges,
  ToggleEnableChallenge
}
