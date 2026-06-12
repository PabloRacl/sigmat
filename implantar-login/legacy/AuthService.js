const loginLdap = require("../modules/login-ldap");
const createUserToken = require("../helpers/create-user-token");

const Usuario_perfil = require("../models/Usuario_Perfil");
const Perfil = require("../models/Perfil");
const User = require("../models/User");
const Sistema = require("../models/Sistema");
const ViewSgpm = require('../models/ViewSgpm')

const { Sequelize, where } = require("sequelize");

class AuthService {
  async login(authorization, req, res) {
    try {
      // o modulo loginLdap retorna o CPF cadastrado na API de Login, essa CPF se encontra na coluna login
      const isSigned = await loginLdap(authorization);

      if (!isSigned) {
        throw new Error("Login ou senha incorretos! ");
      }

      const sgpmData = await ViewSgpm.findOne({
        raw: true,
        where: {
          cpf: isSigned
        },
        attributes: [
          "cpf",
          "matricula",
          "sigla",
          "nome_completo",
          "nome_guerra",
          "rg_funcional",
          "organizacao_disp",
          "secao",
          "id_organizacao_disp",
        ],
      })


      // console.log(isSigned, "######### is Siigned ########")
      //busca no banco de dados todos os resultados do usuário baseado no cpf retornado pela variável isSigned
      //que usa o loginLdap
      const userData = await Usuario_perfil.findAll({
        raw: true,
        include: [
          {
            model: User,
            where: { cpf: isSigned },
          },
          {
            model: Perfil,
          },
          {
            model: Sistema,
          }
        ],
        attributes: ['Usuario.nome', 'Usuario.cpf', 'Usuario.ativo', [Sequelize.col('Perfil.nome'), 'perfil'], [Sequelize.col('Perfil.id_perfil'), 'id_perfil'], [Sequelize.col('Sistema.id_sistema'), 'id_sistema'], [Sequelize.col('Sistema.nome'), 'sistema']]

      });
      // console.log("USER DATA: ",  userData );
      // console.log("TESTE DE DATA: ", userData[0].Usuario.ativo)

      if (userData[0].ativo === false) {
        throw new Error("Acesso não permitido");
      }
      //VARIAVEL QUE SERÁ PASSADA DENTRO DO TOKEN
      const sistemasHabilitados = []
      const perfisDoUsuario = []

      userData.forEach(data => {
        sistemasHabilitados.push(data.id_sistema)
      });
      userData.forEach(data => {
        perfisDoUsuario.push(data.id_perfil)
      })

      // console.log("SISTEMAS", sistemasHabilitados)
      // console.log("PERFIL", perfisDoUsuario)


      const user = {
        nome: userData[0].nome,
        cpf: userData[0].cpf,
        matricula: sgpmData.matricula,
        cargo: sgpmData.sigla,
        ome: sgpmData.organizacao_disp,
        perfil: perfisDoUsuario,
        status: userData[0].ativo,
        sistemasHabilitados: sistemasHabilitados,
      };

      if (!user.sistemasHabilitados.includes(19)) {
        throw new Error('Usuário não possui as permissões necessárias para acessar esse sistema')
      } // 17 é o numero do ID do sistema no portal

      // console.log(user)

      await createUserToken(user, req, res);
    } catch (error) {
      if (error == "TypeError: Cannot read properties of undefined (reading 'ativo')") {
        throw new Error('Usuário não possui as permissões necessárias para acessar esse sistema')
      }
      throw Error(error);
    }
  }
}

module.exports = AuthService;