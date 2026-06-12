const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const pathToKey = path.join(__dirname, "../..", "id_rsa_priv.pem");
const PRIVATE_KEY = fs.readFileSync(pathToKey, "utf8");

/**
 * Middleware para validar o Bearer JWT Token enviado no cabeçalho das requisições.
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Token de autenticação não fornecido. Acesso negado.'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Formato do token inválido. O formato deve ser "Bearer <TOKEN>".'
    });
  }

  const token = parts[1];

  jwt.verify(token, PRIVATE_KEY, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        error: 'Token inválido ou expirado. Efetue login novamente.'
      });
    }

    // Vincula os dados do usuário corporativo autenticado (id, nome, email, perfil) à requisição
    req.user = decoded;
    next();
  });
};

/**
 * Middleware de RBAC (Role-Based Access Control) para restringir rotas a perfis específicos.
 * 
 * @param {string[]} allowedRoles - Lista de perfis autorizados (ex: ['admin', 'usuario'])
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado no contexto da requisição.'
      });
    }

    const { perfil } = req.user;

    if (!allowedRoles.includes(perfil)) {
      return res.status(403).json({
        error: `Acesso negado. Seu perfil de acesso (${perfil}) não possui permissão para esta operação.`
      });
    }

    next();
  };
};

module.exports = {
  authenticateJWT,
  checkRole
};
