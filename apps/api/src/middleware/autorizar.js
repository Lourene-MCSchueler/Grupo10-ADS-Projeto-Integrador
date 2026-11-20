const auth = require('./auth');

// Uso: router.get('/rota', autorizar('gestor', 'medico'), handler)
// Já inclui a verificação de autenticação.
module.exports = (...roles) => [
  auth,
  (req, res, next) => {
    if (!roles.includes(req.session.role)) {
      return res.status(403).json({ erro: 'Acesso negado para o seu perfil.', perfis_permitidos: roles });
    }
    next();
  },
];
