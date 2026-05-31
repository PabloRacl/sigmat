const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const fs = require("fs");
const path = require("path");
const Usuario_perfil = require("../models/Usuario_Perfil");
const Perfil = require("../models/Perfil");
const User = require("../models/User");
const Sistema = require("../models/Sistema");
const { Sequelize } = require("sequelize");

const { SISTEMA } = process.env

const pathToKey = path.join(__dirname, "../../id_rsa_pub.pem");
const PUB_KEY = fs.readFileSync(pathToKey, "utf8");

// At a minimum, you must pass the `jwtFromRequest` and `secretOrKey` properties
const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: PUB_KEY,
  algorithms: ["RS256"],
  maxAge: "40m"
};

// app.js vai passar o objeto global do passport aqui
module.exports = (passport) => {
  // The JWT payload é passado para retornar no callbacl
  passport.use(
    new JwtStrategy(options, function (payload, done) {
      // console.log(payload);

      // if(payload.exp)

      // vai buscar os dados do payload no banco
       Usuario_perfil.findAll(
        {
          raw: true,
          where: {
           id_sistema: SISTEMA, // numero do sistema na database
           situacao: true
          },
          include: [
            {
              model: User,
              where: { cpf: payload.sub }, //payload tem um subject que é o cpf definido na criação do token
            },
            {
              model: Perfil,
            },
          ],
          attributes: [
            'situacao',
            "Usuario.nome",
            "Usuario.cpf",
            "Usuario.ativo",
            [Sequelize.col("Perfil.nome"), "perfil"],
            [Sequelize.col("Perfil.admin"), "admin"]
          ],
        },
      ).then((user) => {
        if(user.length > 0 && user[0].situacao == true ){
          return done(null, user)
        } else {
          return done(null, false)
        }
      }).catch(err => done(err, null))
      
      ;
    })
  );
};