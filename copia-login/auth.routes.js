const { Router } = require('express')
const router = Router()
const AuthController = require('../controllers/auth.controller');

router
    .post('/login', AuthController.login)
    .post('/logout', AuthController.logout)

module.exports = router