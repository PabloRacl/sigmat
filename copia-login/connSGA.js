const { Sequelize } = require('sequelize')

// require('dotenv').config()
const { SGA_DB_DATABASE, SGA_DB_PASSWORD, SGA_DB_HOST, SGA_DB_USER } = process.env

const sequelize = new Sequelize(SGA_DB_DATABASE, SGA_DB_USER, SGA_DB_PASSWORD, {
    host: SGA_DB_HOST,
    dialect: SGA_DB_USER,
    // timezone: '-03:00',
    schema: 'mseg'
})
try {
    sequelize.authenticate()
    console.log('Conectado ao Banco de Dados SGA')
} catch (error) {
    console.log('Erro ao conectar no banco: ' + error)
}

module.exports = sequelize