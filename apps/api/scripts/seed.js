const bcrypt = require('bcryptjs');
const db = require('../src/database');

// Funcionários (login e perfil de acesso)
const insertFuncionario = db.prepare(
  'INSERT OR IGNORE INTO funcionarios (nome, email, senha, role) VALUES (?, ?, ?, ?)'
);
const getFuncionario = db.prepare('SELECT id FROM funcionarios WHERE email = ?');

const funcionarios = [
  { nome: 'Dra. Ana Lima',   email: 'ana@clinica.com',      senha: '123456', role: 'medico' },
  { nome: 'Dr. Bruno Costa', email: 'bruno@clinica.com',    senha: '123456', role: 'medico' },
  { nome: 'Paula Recepção',  email: 'recepcao@clinica.com', senha: '123456', role: 'recepcao' },
  { nome: 'Gustavo Gestor',  email: 'gestor@clinica.com',   senha: '123456', role: 'gestor' },
];

for (const f of funcionarios) {
  const hash = bcrypt.hashSync(f.senha, 10);
  insertFuncionario.run(f.nome, f.email, hash, f.role);
  console.log(`Funcionário (${f.role}): ${f.email} / senha: ${f.senha}`);
}

// Médicos (dados profissionais do funcionário com role 'medico')
const insertMedico = db.prepare(
  'INSERT OR IGNORE INTO medicos (funcionario_id, crm) VALUES (?, ?)'
);

const medicos = [
  { email: 'ana@clinica.com',   crm: 'CRM-SP-12345' },
  { email: 'bruno@clinica.com', crm: 'CRM-SP-67890' },
];

for (const m of medicos) {
  const funcionario = getFuncionario.get(m.email);
  if (!funcionario) continue;
  insertMedico.run(funcionario.id, m.crm);
  console.log(`Médico: ${m.email} / CRM: ${m.crm}`);
}

// Pacientes
const insertPaciente = db.prepare(
  'INSERT OR IGNORE INTO pacientes (nome, email, telefone) VALUES (?, ?, ?)'
);

const pacientes = [
  { nome: 'João Silva',    email: 'joao@email.com',   telefone: '11991110001' },
  { nome: 'Maria Souza',   email: 'maria@email.com',  telefone: '11991110002' },
  { nome: 'Carlos Pereira',email: 'carlos@email.com', telefone: '11991110003' },
  { nome: 'Fernanda Lima', email: 'fer@email.com',    telefone: '11991110004' },
];

for (const p of pacientes) {
  insertPaciente.run(p.nome, p.email, p.telefone);
  console.log(`Paciente: ${p.nome}`);
}

// Consultas
const getMedico = db.prepare(`
  SELECT m.id FROM medicos m
  JOIN funcionarios f ON f.id = m.funcionario_id
  WHERE f.email = ?
`);
const getPaciente = db.prepare('SELECT id FROM pacientes WHERE email = ? LIMIT 1');

const insertConsulta = db.prepare(
  'INSERT OR IGNORE INTO consultas (paciente_id, medico_id, data_hora) VALUES (?, ?, ?)'
);

// Manhã e tarde em cada dia, para testar o filtro de horário
// (ex.: horaInicio=07:00&horaFim=12:00 traz só a manhã; 12:00 já conta como tarde)
const ANA = 'ana@clinica.com';
const BRUNO = 'bruno@clinica.com';

const consultas = [
  // 23/11
  { data_hora: '2026-11-23T08:00', paciente_email: 'joao@email.com',   medico_email: ANA },
  { data_hora: '2026-11-23T09:30', paciente_email: 'maria@email.com',  medico_email: ANA },
  { data_hora: '2026-11-23T11:00', paciente_email: 'carlos@email.com', medico_email: ANA },
  { data_hora: '2026-11-23T14:00', paciente_email: 'fer@email.com',    medico_email: ANA },
  { data_hora: '2026-11-23T16:30', paciente_email: 'joao@email.com',   medico_email: ANA },
  { data_hora: '2026-11-23T08:30', paciente_email: 'carlos@email.com', medico_email: BRUNO },
  { data_hora: '2026-11-23T15:00', paciente_email: 'maria@email.com',  medico_email: BRUNO },

  // 24/11
  { data_hora: '2026-11-24T07:30', paciente_email: 'fer@email.com',    medico_email: ANA },
  { data_hora: '2026-11-24T10:00', paciente_email: 'carlos@email.com', medico_email: ANA },
  { data_hora: '2026-11-24T13:30', paciente_email: 'maria@email.com',  medico_email: ANA },
  { data_hora: '2026-11-24T17:00', paciente_email: 'joao@email.com',   medico_email: ANA },
  { data_hora: '2026-11-24T09:00', paciente_email: 'joao@email.com',   medico_email: BRUNO },
  { data_hora: '2026-11-24T14:30', paciente_email: 'fer@email.com',    medico_email: BRUNO },

  // 25/11
  { data_hora: '2026-11-25T08:00', paciente_email: 'maria@email.com',  medico_email: ANA },
  { data_hora: '2026-11-25T11:30', paciente_email: 'fer@email.com',    medico_email: ANA },
  { data_hora: '2026-11-25T12:00', paciente_email: 'carlos@email.com', medico_email: ANA },
  { data_hora: '2026-11-25T15:30', paciente_email: 'joao@email.com',   medico_email: ANA },
  { data_hora: '2026-11-25T10:30', paciente_email: 'maria@email.com',  medico_email: BRUNO },
  { data_hora: '2026-11-25T16:00', paciente_email: 'carlos@email.com', medico_email: BRUNO },
];

for (const c of consultas) {
  const paciente = getPaciente.get(c.paciente_email);
  const medico = getMedico.get(c.medico_email);
  if (!paciente || !medico) continue;
  const { changes } = insertConsulta.run(paciente.id, medico.id, c.data_hora);
  if (changes) console.log(`Consulta: ${c.data_hora} — paciente ${c.paciente_email}`);
}

console.log('Seed concluído.');
