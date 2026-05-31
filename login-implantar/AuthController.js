const AuthService = require("../services/AuthService");
const authService = new AuthService();

class AuthController {
  static async login(req, res) {
    
    
    const { authorization } = req.headers;
    // console.log("Auhtorization", { req: req.headers.authorization });

    try {
      await authService.login(authorization, req, res);
      // res.status(200).send(user)
    } catch (error) {
      res.status(401).send({ message: error.message });
    }
  }
    static async logout(req, res) {
      try {
          req.logout((err) => {
            if (err) {
              console.error('Erro ao fazer logout:', err);
              return res.status(500).send('Erro ao fazer logout');
            }
            res.redirect('/');
          });
        
      } catch (error) {
        res.status(401).send({ message: error.message });
      }
    }
}

module.exports = AuthController;