const bcrypt = require('bcryptjs');
const db = require('../database');
const auth = require('../middleware/auth');

module.exports = (router) => {
  router.post('/auth/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
    }

    const funcionario = db.prepare(`
      SELECT f.*, m.id AS medico_id, m.crm
      FROM funcionarios f
      LEFT JOIN medicos m ON m.funcionario_id = f.id
      WHERE f.email = ?
    `).get(email);

    if (!funcionario || !bcrypt.compareSync(senha, funcionario.senha)) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    req.session.funcionarioId = funcionario.id;
    req.session.funcionarioNome = funcionario.nome;
    req.session.role = funcionario.role;
    req.session.medicoId = funcionario.medico_id; // null para recepção e gestor
    req.session.crm = funcionario.crm;

    res.json({
      id: funcionario.id,
      nome: funcionario.nome,
      role: funcionario.role,
      medico_id: funcionario.medico_id,
      crm: funcionario.crm,
    });
  });

  router.post('/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  router.get('/auth/me', auth, (req, res) => {
    res.json({
      id: req.session.funcionarioId,
      nome: req.session.funcionarioNome,
      role: req.session.role,
      medico_id: req.session.medicoId,
      crm: req.session.crm ?? null,
    });
  });
};
