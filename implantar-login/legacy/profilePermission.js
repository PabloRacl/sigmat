const jwt = require("jsonwebtoken");
const getToken = require("../helpers/get-token");

const { PROFILE_ADMIN, PROFILE_P1,PROFILE_P3, PROFILE_FISCAL } = process.env;
// convertido pra numeros porque a variavel do .env só interpreta como string
const profileAdmin = Number(PROFILE_ADMIN);
const profileP1 = Number(PROFILE_P1);
const profileP3 = Number(PROFILE_P3);
const profileFiscal = Number(PROFILE_FISCAL);

//recursos
const fs = require("fs");
const path = require("path");

const pathToKey = path.join(__dirname, "../..", "id_rsa_priv.pem");
const PRIVATE_KEY = fs.readFileSync(pathToKey, "utf8");

const isAdmin = (req, res, next) => {

  const token = getToken(req);
  try {
    const verified = jwt.verify(token, PRIVATE_KEY);

    const perfilAdm = verified.perfil;

    if (!perfilAdm.includes(profileAdmin)) {
      return res.status(401).json({ message: "Acesso negado!" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido!" });
  }
};

const isP1 = (req, res, next) => {
  const token = getToken(req);
  try {
    const verified = jwt.verify(token, PRIVATE_KEY);

    const perfil = verified.perfil;
 
    if (!perfil.includes(profileAdmin) && !perfil.includes(profileP1)) {
      return res.status(401).json({ message: "Acesso negado!" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido!" });
  }
};

const isP3 = (req, res, next) => {
  const token = getToken(req);
  try {
    const verified = jwt.verify(token, PRIVATE_KEY);

    const perfil = verified.perfil;

    if (
      !perfil.includes(profileAdmin) &&
      !perfil.includes(profileP1) &&
      !perfil.includes(profileP3)
    ) {
      return res.status(401).json({ message: "Acesso negado!" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido!" });
  }
}

const isFiscal = (req, res, next) => {
  const token = getToken(req);
  try {
    const verified = jwt.verify(token, PRIVATE_KEY);

    const perfil = verified.perfil;

    if (
      !perfil.includes(profileAdmin) &&
      !perfil.includes(profileP1) &&
       !perfil.includes(profileP3) &&
      !perfil.includes(profileFiscal)
    ) {
      return res.status(401).json({ message: "Acesso negado!" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido!" });
  }
};


module.exports = { isP1, isAdmin, isFiscal, isP3};
