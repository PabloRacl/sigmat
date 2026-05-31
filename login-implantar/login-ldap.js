// const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const axios = require("axios");
const https = require('https')

const { API_LDAP } = process.env;



async function loginLdap(authorizationHeader) {
  try {
    // String em base64
    const authorization = authorizationHeader.split(" ")[1];
    // Decodificando a string em base64 para um Buffer
    const decodedBuffer = Buffer.from(authorization, "base64");
    // Convertendo o Buffer de volta para uma string
    const decodedString = decodedBuffer.toString("utf-8");

    //new url
    const url = API_LDAP
    //old url, vai pra o 12 porta 90
    // const url = "http://200.238.92.106:90/api/";

    const usuario = decodedString.split(":")[0];
    const senha = decodedString.split(":")[1];
    const responseReturn = [];

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const data = new URLSearchParams();
    data.append("usuario", usuario); // Adiciona o usuário
    data.append("senha", senha); // Adiciona a senha

    const httpsAgent = new https.Agent({ family: 4 });

    const response = await axios.post(url, data, { headers, httpsAgent });

    if (response.data === undefined || response.data === "Usuário nao encontrado") {
      console.log("Erro no retorno dos dados da API");
      return false;
    } else {
      const body = response.data;
      body.data.forEach((item) => {
        const loginString = item.find((str) => str.includes("Login:"));
        const loginValue = loginString.split(":")[1].trim(); // Divide a string e remove espaços em branco

        responseReturn.push(loginValue);
      });

      return responseReturn[0];
    }
  } catch (error) {
    console.log("Erro interno do servidor:", error.message);
    if (error.response) {
      console.log("Detalhes do erro:", error.response.data);
    }
  }
}

module.exports = loginLdap;