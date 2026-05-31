const ViewSgpm = require("../models/ViewSgpm");

async function verifySgpm(cpf) {
  try {
    let consultaResult = true;

    //procura no SGPM as informações para retornar o necessário a ser usado pelo server a partir do CPF
    const sgpmConsulta = await ViewSgpm.findOne({
      raw: true,
      where: { cpf: cpf },
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
    });
    //verifica se o usuário já é cadastrado em  alguma seção
    // if (sgpmConsulta.secao == null || sgpmConsulta.secao == undefined || sgpmConsulta.secao == "") {
    //   consultaResult = false;
    // }
    return consultaResult;
  } catch (error) {
    console.log("Erro na verificação da seção: ", error);
  }
}

module.exports = verifySgpm;