const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { PROFILE_ADMIN, PROFILE_P1, PROFILE_P3, PROFILE_OPERADOR, PROFILE_FISCAL } = process.env;

const pathToKey = path.join(__dirname, "../..", "id_rsa_priv.pem");
const PRIVATE_KEY = fs.readFileSync(pathToKey, "utf8");

const createUserToken = async (user, req, res) => {
  //create a token
  try {
    const token = jwt.sign(
      {
        nome: user.nome,
        cpf: user.cpf,
        matricula: user.matricula,
        cargo: user.cargo,
        ome: user.ome,
        perfil: user.perfil,
        sistemasHabilitados: user.sistemasHabilitados,
        sub: user.cpf,
        exp: Math.floor(Date.now() / 1000) + 40 * 60,
      },
      PRIVATE_KEY,
      { algorithm: "RS256" },
      {
        expiresIn: '40m',
      }
    );

    //return token
    let perfil_usuario;
    if (user.perfil.includes(Number(PROFILE_ADMIN))) {
      perfil_usuario = PROFILE_ADMIN;
      perfil_nome = `ADMIN`;
    } else if (user.perfil.includes(Number(PROFILE_FISCAL))) {
      perfil_usuario = PROFILE_FISCAL;
      perfil_nome = `FISCAL`;
    }  else if (user.perfil.includes(Number(PROFILE_P1))) {
      perfil_usuario = PROFILE_P1;
      perfil_nome = `P1`;
    }  else if (user.perfil.includes(Number(PROFILE_P3))) {
      perfil_usuario = PROFILE_P3;
      perfil_nome = `P3`;
    } else {
      perfil_usuario = PROFILE_OPERADOR;
      perfil_nome = `OPERADOR`;
    }

    return res.status(200).json({
      token: token,
      nome: user.nome,
      perfil: perfil_usuario,
      perfil_nome: perfil_nome,
      //aguardando criação de lista de sistemas e perfis
    });
  } catch (error) {
    res.status(500).send({ message: "Erro na criação do Token: " + error });
  }
};
module.exports = createUserToken;
