const { Sequelize } = require('sequelize')

// require('dotenv').config()
const { SGPM_DB_DATABASE, SGPM_DB_PASSWORD, SGPM_DB_HOST, SGPM_DB_USER } = process.env

const sequelize = new Sequelize(SGPM_DB_DATABASE, SGPM_DB_USER, SGPM_DB_PASSWORD, {
    host: SGPM_DB_HOST,
    dialect: SGPM_DB_USER,
    // timezone: '-03:00',
    schema: 'mrh'
})
try {
    sequelize.authenticate()
    console.log('Conectado ao Banco de Dados')
} catch (error) {
    console.log('Erro ao conectar no banco: ' + error)
}

module.exports = sequelize