module.exports = (req, res, next) => {
  if (!req.session.funcionarioId) {
    return res.status(401).json({ erro: 'Não autenticado.' });
  }
  next();
};
