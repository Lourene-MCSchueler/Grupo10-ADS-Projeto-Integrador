const ExcelJS = require('exceljs');
const db = require('../database');
const auth = require('../middleware/auth');
const autorizar = require('../middleware/autorizar');
const { validarFiltrosConsulta } = require('../utils/filtros');

// Consulta compartilhada entre a listagem e a exportação.
// Intervalo de horário: horaInicio inclusivo, horaFim exclusivo (07:00–12:00 não traz 12:00).
function buscarConsultas({ data, horaInicio, horaFim, medicoId }) {
  const condicoes = ['c.data_hora LIKE ?'];
  const params = [`${data}%`];

  if (horaInicio) {
    condicoes.push('substr(c.data_hora, 12, 5) >= ?');
    params.push(horaInicio);
  }
  if (horaFim) {
    condicoes.push('substr(c.data_hora, 12, 5) < ?');
    params.push(horaFim);
  }
  if (medicoId) {
    condicoes.push('c.medico_id = ?');
    params.push(medicoId);
  }

  return db.prepare(`
    SELECT c.id, c.data_hora, c.status,
           p.id AS paciente_id, p.nome AS paciente_nome, p.telefone AS paciente_telefone,
           p.email AS paciente_email,
           m.id AS medico_id, fm.nome AS medico_nome, m.crm AS medico_crm,
           a.criado_em AS ausencia_registrada_em,
           a.notificacao_status, a.notificado_em
    FROM consultas c
    JOIN pacientes p ON p.id = c.paciente_id
    JOIN medicos m ON m.id = c.medico_id
    JOIN funcionarios fm ON fm.id = m.funcionario_id
    LEFT JOIN ausencias a ON a.consulta_id = c.id
    WHERE ${condicoes.join(' AND ')}
    ORDER BY c.data_hora, fm.nome
  `).all(...params);
}

const COLUNAS_EXPORTACAO = [
  { header: 'ID consulta', key: 'id', width: 12 },
  { header: 'Data', key: 'data', width: 12 },
  { header: 'Horário', key: 'horario', width: 10 },
  { header: 'Status da consulta', key: 'status', width: 18 },
  { header: 'Médico', key: 'medico_nome', width: 24 },
  { header: 'CRM', key: 'medico_crm', width: 16 },
  { header: 'Paciente', key: 'paciente_nome', width: 24 },
  { header: 'Telefone', key: 'paciente_telefone', width: 16 },
  { header: 'E-mail do paciente', key: 'paciente_email', width: 26 },
  { header: 'Ausência registrada em', key: 'ausencia_registrada_em', width: 22 },
  { header: 'Status da notificação', key: 'notificacao_status', width: 20 },
  { header: 'Notificado em', key: 'notificado_em', width: 20 },
];

module.exports = (router) => {
  router.get('/consultas', auth, (req, res) => {
    const { erro, status, filtros } = validarFiltrosConsulta(req.query, req.session);
    if (erro) {
      return res.status(status || 400).json({ erro });
    }

    res.json(buscarConsultas(filtros));
  });

  router.get('/consultas/export', autorizar('medico', 'gestor'), async (req, res) => {
    const { erro, status, filtros } = validarFiltrosConsulta(req.query, req.session);
    if (erro) {
      return res.status(status || 400).json({ erro });
    }

    const consultas = buscarConsultas(filtros);

    db.prepare('INSERT INTO auditoria (funcionario_id, acao, filtros) VALUES (?, ?, ?)')
      .run(req.session.funcionarioId, 'exportar_consultas', JSON.stringify(filtros));

    const workbook = new ExcelJS.Workbook();
    const planilha = workbook.addWorksheet('Consultas');
    planilha.columns = COLUNAS_EXPORTACAO;
    planilha.getRow(1).font = { bold: true };

    for (const c of consultas) {
      planilha.addRow({
        ...c,
        data: c.data_hora.slice(0, 10),
        horario: c.data_hora.slice(11, 16),
        notificacao_status: c.notificacao_status || 'não se aplica',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="consultas-${filtros.data}.xlsx"`);
    res.send(Buffer.from(buffer));
  });
};
