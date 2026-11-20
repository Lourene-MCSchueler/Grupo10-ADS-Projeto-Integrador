const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'banco.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS medicos (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    nome    TEXT NOT NULL,
    email   TEXT UNIQUE NOT NULL,
    senha   TEXT NOT NULL,
    crm     TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pacientes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nome      TEXT NOT NULL,
    email     TEXT UNIQUE,
    telefone  TEXT
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_pacientes_email ON pacientes(email);

  CREATE TABLE IF NOT EXISTS consultas (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
    medico_id   INTEGER NOT NULL REFERENCES medicos(id),
    data_hora   TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'agendada'
                CHECK(status IN ('agendada', 'realizada', 'ausente'))
  );

  CREATE TABLE IF NOT EXISTS ausencias (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    consulta_id INTEGER NOT NULL REFERENCES consultas(id),
    criado_em   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_consultas_unica
    ON consultas(paciente_id, medico_id, data_hora);
`);

// Migrações aplicadas em ordem, controladas por PRAGMA user_version.
// Nunca altere uma migração já publicada: adicione uma nova ao final.
const migracoes = [
  // 1 — funcionarios: login e perfil (role) de todos que acessam o sistema.
  //     medicos passa a guardar só os dados do médico (CRM), ligado ao funcionário.
  //     Os ids de medicos são mantidos, então consultas.medico_id não muda.
  () => {
    db.exec(`
      CREATE TABLE funcionarios (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        nome    TEXT NOT NULL,
        email   TEXT UNIQUE NOT NULL,
        senha   TEXT NOT NULL,
        role    TEXT NOT NULL CHECK(role IN ('medico', 'recepcao', 'gestor'))
      );

      INSERT INTO funcionarios (id, nome, email, senha, role)
        SELECT id, nome, email, senha, 'medico' FROM medicos;

      CREATE TABLE medicos_nova (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        funcionario_id  INTEGER UNIQUE NOT NULL REFERENCES funcionarios(id),
        crm             TEXT UNIQUE NOT NULL
      );

      INSERT INTO medicos_nova (id, funcionario_id, crm)
        SELECT id, id, crm FROM medicos;

      DROP TABLE medicos;
      ALTER TABLE medicos_nova RENAME TO medicos;
    `);
  },

  // 2 — status de envio da notificação de WhatsApp em cada ausência
  () => {
    db.exec(`
      ALTER TABLE ausencias ADD COLUMN notificacao_status TEXT NOT NULL DEFAULT 'pendente'
        CHECK(notificacao_status IN ('pendente', 'enviada', 'falha'));
      ALTER TABLE ausencias ADD COLUMN notificado_em TEXT;

      -- ausências antigas já tiveram o aviso disparado no momento do registro
      UPDATE ausencias SET notificacao_status = 'enviada', notificado_em = criado_em;
    `);
  },

  // 3 — log de auditoria
  () => {
    db.exec(`
      CREATE TABLE auditoria (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        funcionario_id  INTEGER NOT NULL REFERENCES funcionarios(id),
        acao        TEXT NOT NULL,
        filtros     TEXT,
        criado_em   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `);
  },
];

let versao = db.pragma('user_version', { simple: true });

for (; versao < migracoes.length; versao++) {
  // recriar tabela referenciada por FK exige foreign_keys desligado (fora da transação)
  db.pragma('foreign_keys = OFF');
  db.transaction(() => {
    migracoes[versao]();
    const violacoes = db.pragma('foreign_key_check');
    if (violacoes.length) {
      throw new Error(`Migração ${versao + 1} gerou violações de chave estrangeira.`);
    }
    db.pragma(`user_version = ${versao + 1}`);
  })();
  db.pragma('foreign_keys = ON');
}

module.exports = db;
