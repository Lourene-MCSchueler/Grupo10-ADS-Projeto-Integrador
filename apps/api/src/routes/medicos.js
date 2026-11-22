const db = require('../database');
const auth = require('../middleware/auth');

module.exports = (router) => {
  // Lista de médicos para o filtro da agenda. Médicos recebem só o próprio cadastro.
  router.get('/medicos', auth, (req, res) => {
    const somenteProprio = req.session.role === 'medico';

    const medicos = db.prepare(`
      SELECT m.id, f.nome, m.crm
      FROM medicos m
      JOIN funcionarios f ON f.id = m.funcionario_id
      ${somenteProprio ? 'WHERE m.id = ?' : ''}
      ORDER BY f.nome
    `).all(...(somenteProprio ? [req.session.medicoId] : []));

    res.json(medicos);
  });
};
