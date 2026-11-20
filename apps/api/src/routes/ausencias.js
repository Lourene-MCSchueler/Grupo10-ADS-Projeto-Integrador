const db = require('../database');
const auth = require('../middleware/auth');
const autorizar = require('../middleware/autorizar');
const { validarFiltrosResumo } = require('../utils/filtros');
const whatsapp = require('../services/whatsapp');

module.exports = (router) => {
  router.post('/ausencias', auth, (req, res) => {
    const { consulta_ids } = req.body;

    if (!Array.isArray(consulta_ids) || consulta_ids.length === 0) {
      return res.status(400).json({ erro: 'consulta_ids deve ser um array não vazio.' });
    }

    const placeholders = consulta_ids.map(() => '?').join(', ');

    // médicos só registram ausência nas próprias consultas; recepção e gestor em qualquer uma
    const somenteProprias = req.session.role === 'medico';

    const consultas = db.prepare(`
      SELECT c.id, c.status, c.data_hora,
             p.nome AS paciente_nome, p.telefone AS paciente_telefone,
             fm.nome AS medico_nome
      FROM consultas c
      JOIN pacientes p ON p.id = c.paciente_id
      JOIN medicos m ON m.id = c.medico_id
      JOIN funcionarios fm ON fm.id = m.funcionario_id
      WHERE c.id IN (${placeholders}) ${somenteProprias ? 'AND c.medico_id = ?' : ''}
    `).all(...consulta_ids, ...(somenteProprias ? [req.session.medicoId] : []));

    const naoEncontradas = consulta_ids.filter(id => !consultas.find(c => c.id === id));
    if (naoEncontradas.length > 0) {
      return res.status(404).json({ erro: 'Consultas não encontradas ou sem permissão.', ids: naoEncontradas });
    }

    const jaProcessadas = consultas.filter(c => c.status !== 'agendada');
    if (jaProcessadas.length > 0) {
      return res.status(409).json({
        erro: 'Algumas consultas já possuem status diferente de agendada.',
        consultas: jaProcessadas.map(c => ({ id: c.id, status: c.status })),
      });
    }

    const notificacoes = { enviadas: 0, falhas: 0 };

    const marcarTodas = db.transaction(() => {
      for (const consulta of consultas) {
        db.prepare("UPDATE consultas SET status = 'ausente' WHERE id = ?").run(consulta.id);

        let notificacaoStatus = 'enviada';
        try {
          whatsapp.enviarAviso(consulta);
          notificacoes.enviadas++;
        } catch (err) {
          notificacaoStatus = 'falha';
          notificacoes.falhas++;
          console.error(`[WhatsApp] Falha ao avisar consulta ${consulta.id}: ${err.message}`);
        }

        db.prepare(`
          INSERT INTO ausencias (consulta_id, notificacao_status, notificado_em)
          VALUES (?, ?, CASE WHEN ? = 'enviada' THEN datetime('now', 'localtime') END)
        `).run(consulta.id, notificacaoStatus, notificacaoStatus);
      }
    });

    marcarTodas();

    const falhas = notificacoes.falhas ? ` ${notificacoes.falhas} notificação(ões) falharam.` : '';
    res.json({
      mensagem: `Médico marcado como ausente. ${notificacoes.enviadas} paciente(s) notificado(s).${falhas}`,
      consulta_ids,
      notificacoes,
    });
  });

  router.get('/ausencias/resumo', autorizar('gestor'), (req, res) => {
    const { erro, filtros } = validarFiltrosResumo(req.query);
    if (erro) {
      return res.status(400).json({ erro });
    }

    // o dia da ausência é o dia da consulta afetada (não a data em que foi registrada)
    const linhas = db.prepare(`
      SELECT m.id AS medico_id, fm.nome AS medico_nome,
             substr(c.data_hora, 1, 10) AS dia, COUNT(*) AS total
      FROM ausencias a
      JOIN consultas c ON c.id = a.consulta_id
      JOIN medicos m ON m.id = c.medico_id
      JOIN funcionarios fm ON fm.id = m.funcionario_id
      WHERE substr(c.data_hora, 1, 7) = ? ${filtros.medicoId ? 'AND c.medico_id = ?' : ''}
      GROUP BY m.id, dia
      ORDER BY fm.nome, dia
    `).all(filtros.mes, ...(filtros.medicoId ? [filtros.medicoId] : []));

    const porMedico = new Map();
    const porDia = new Map();

    for (const l of linhas) {
      if (!porMedico.has(l.medico_id)) {
        porMedico.set(l.medico_id, { medico_id: l.medico_id, medico_nome: l.medico_nome, total: 0, por_dia: [] });
      }
      const medico = porMedico.get(l.medico_id);
      medico.total += l.total;
      medico.por_dia.push({ dia: l.dia, total: l.total });

      porDia.set(l.dia, (porDia.get(l.dia) || 0) + l.total);
    }

    res.json({
      mes: filtros.mes,
      medico_id: filtros.medicoId,
      total: linhas.reduce((soma, l) => soma + l.total, 0),
      por_medico: [...porMedico.values()],
      por_dia: [...porDia.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([dia, total]) => ({ dia, total })),
    });
  });
};
