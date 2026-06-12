const jwt = require('jsonwebtoken')
const getToken = require('./get-token')

//recursos
const fs = require("fs");
const path = require("path");

const pathToKey = path.join(__dirname, "..", "id_rsa_priv.pem");
const PRIVATE_KEY = fs.readFileSync(pathToKey, "utf8");

function getSistemasByToken( req, res) {
    const token = getToken(req)
    const decode = jwt.verify(token, PRIVATE_KEY)
    
    //pega o perfil através do json retornado pelo jwt.verify
    const sistemas = decode.sistemasHabilitados
    
    return sistemas
} 

module.exports = getSistemasByToken