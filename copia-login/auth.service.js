require('dotenv').config()
const loginLdap = require("../modules/login-ldap");
const createUserToken = require("../middlewares/createUserToken");

const User = require("../models/User");
const Sistema = require("../models/Sistema");
const Perfil = require("../models/Perfil");
const Usuario_perfil = require("../models/Usuario_Perfil");
const ViewSgpm = require('../models/ViewSgpm')



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


      // console.log(sgpmData, "######### is sgpmData ########")
      //busca no banco de dados todos os resultados do usuário baseado no cpf retornado pela variável isSigned
      //que usa o loginLdap

      const queryResults = await Usuario_perfil.findAll({

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
      });

      // Converte os resultados do Sequelize para objetos planos preservando o aninhamento
      const userData = queryResults.map(r => r.get({ plain: true }));

      if (!userData.length || userData[0]?.Usuario?.ativo === false) {
        throw new Error("Acesso não permitido");
      }

      //VARIAVEL QUE SERÁ PASSADA DENTRO DO TOKEN
      const sistemasHabilitados = []
      const perfisDoUsuario = []

      userData.forEach(data => {
        sistemasHabilitados.push(data.Sistema?.id_sistema || data.sistema?.id_sistema)
      });
      userData.forEach(data => {
        perfisDoUsuario.push(data.Perfil?.id_perfil || data.perfil?.id_perfil)
      })

      // Busca o nome do perfil independente de como o Sequelize envelopou o modelo associado
      const primeiroRegistro = userData[0];
      const nomeDoPerfil = primeiroRegistro?.Perfil?.nome ||
        primeiroRegistro?.Perfil?.nome ||
        'Operador PMP';

      const user = {
        nome: primeiroRegistro?.Usuario?.nome || primeiroRegistro?.usuario?.nome,
        cpf: primeiroRegistro?.Usuario?.cpf || primeiroRegistro?.usuario?.cpf,
        matricula: sgpmData.matricula,
        cargo: sgpmData.sigla,
        ome: sgpmData.organizacao_disp,
        perfil: perfisDoUsuario,
        PerfilNome: nomeDoPerfil,
        status: primeiroRegistro?.Usuario?.ativo || primeiroRegistro?.usuario?.ativo,
        sistemasHabilitados: sistemasHabilitados,
      };

      if (!user.sistemasHabilitados.includes(34)) {
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