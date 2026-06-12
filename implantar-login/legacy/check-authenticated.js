const getToken = require("./get-token");
const jwt = require('jsonwebtoken');

// Usando a CHAVE PÚBLICA para verificar a assinatura RS256
const fs = require("fs");
const path = require("path");

const pathToKey = path.join(__dirname, "../..", "id_rsa_pub.pem");
const PUBLIC_KEY = fs.readFileSync(pathToKey, "utf8");

const checkIsAuthenticated = (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido." });
  }

  try {
    // jwt.verify valida a assinatura — jwt.decode NÃO valida (vulnerabilidade)
    const decoded = jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] });
    req.ome = decoded.ome;
    req.cpf = decoded.cpf;
    req.matricula = decoded.matricula;
    req.perfil = decoded.perfil;
    req.cargo = decoded.cargo;
    req.nome = decoded.nome;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido ou expirado." });
  }
};

module.exports = checkIsAuthenticated;