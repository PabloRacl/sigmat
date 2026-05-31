const jwt = require("jsonwebtoken");
const getToken = require("./get-token");

//recursos
const fs = require("fs");
const path = require("path");

const pathToKey = path.join(__dirname, "..", "id_rsa_priv.pem");
const PRIVATE_KEY = fs.readFileSync(pathToKey, "utf8");


//middleware to validate token
const checkToken = (req, res, next) => {
 
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "Acesso negado!" });
  }

  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ message: "Acesso negado!" });
  }
  try {
    const verified = jwt.verify(token, PRIVATE_KEY)
    req.user = verified
    next()
  } catch (error) {
    return res.status(401).json({ message: "Token inválido!" });
  }
};

module.exports = checkToken;