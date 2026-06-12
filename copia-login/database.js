require('dotenv').config()

const { Sequelize } = require('sequelize')

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_DATABASE,
  DB_PORT,
  DB_SCHEMA
} = process.env

const sequelize = new Sequelize(
  DB_DATABASE,
  DB_USER,
  DB_PASSWORD,
  {
    host: DB_HOST,
    dialect: 'postgres',
    port: DB_PORT,
    schema: DB_SCHEMA,
    // timezone: '-03:00',
    logging: false
  }
)

async function connectDB() {
  try {
    await sequelize.authenticate()
    console.log('Conectado ao Banco de Dados')
  } catch (error) {
    console.log('Erro ao conectar no banco:', error)
  }
}

connectDB()

module.exports = sequelize