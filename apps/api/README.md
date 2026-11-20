# API — Projeto Integrador

Backend REST em Node.js com Express, autenticação via sessão e banco SQLite.

## Tecnologias

- **Express** — servidor HTTP
- **express-session + connect-sqlite3** — sessões persistidas em banco
- **better-sqlite3** — banco de dados SQLite
- **bcryptjs** — hash de senhas
- **exceljs** — geração da planilha de exportação (.xlsx)

## Estrutura

```
apps/api/
├── scripts/
│   └── seed.js            # Popula o banco com dados de teste
├── src/
│   ├── database.js        # Conexão, criação das tabelas e migrações
│   ├── index.js           # Entry point — Express, sessão, rotas
│   ├── middleware/
│   │   ├── auth.js        # Exige sessão ativa
│   │   └── autorizar.js   # Restringe a rota a perfis (role)
│   ├── routes/
│   │   ├── index.js       # Agrega todas as rotas
│   │   ├── auth.js        # Rotas de autenticação
│   │   ├── consultas.js   # Listagem e exportação de consultas
│   │   └── ausencias.js   # Registro e resumo de ausências
│   ├── services/
│   │   └── whatsapp.js    # Montagem e envio (simulado) do aviso ao paciente
│   └── utils/
│       └── filtros.js     # Validação dos filtros de query string
├── banco.db               # Banco principal (gerado automaticamente)
├── sessoes.db             # Sessões (gerado automaticamente)
└── package.json
```

## Tabelas do banco

| Tabela | Descrição |
|--------|-----------|
| `funcionarios` | Quem acessa o sistema (médicos, recepção e gestor): login e perfil (`role`) |
| `medicos` | Dados profissionais do médico (CRM), ligado a um funcionário com `role = 'medico'` |
| `pacientes` | Pacientes cadastrados |
| `consultas` | Agendamentos vinculando médico e paciente |
| `ausencias` | Registro de ausências do médico por consulta, com status do envio da notificação |
| `auditoria` | Log de ações sensíveis (ex.: exportação de consultas) |

### Mudanças no modelo

| Tabela | Campo | Tipo | Observação |
|--------|-------|------|------------|
| `funcionarios` (nova) | `id` | INTEGER PK | |
| `funcionarios` | `nome` | TEXT NOT NULL | |
| `funcionarios` | `email` | TEXT UNIQUE NOT NULL | Login |
| `funcionarios` | `senha` | TEXT NOT NULL | Hash bcrypt |
| `funcionarios` | `role` | TEXT NOT NULL | `medico`, `recepcao` ou `gestor` |
| `medicos` | `funcionario_id` | INTEGER UNIQUE NOT NULL, FK `funcionarios` | **Novo** — relação 1:1 com o funcionário |
| `medicos` | `nome`, `email`, `senha` | — | **Removidos** — passaram para `funcionarios` |
| `ausencias` | `notificacao_status` | TEXT NOT NULL, default `'pendente'` | `pendente`, `enviada` ou `falha` |
| `ausencias` | `notificado_em` | TEXT (nullable) | Data/hora do envio com sucesso |
| `auditoria` (nova) | `id`, `funcionario_id` (FK `funcionarios`), `acao`, `filtros` (JSON), `criado_em` | — | |

Relacionamentos: `funcionarios` 1 — 0..1 `medicos` 1 — N `consultas` N — 1 `pacientes`; `consultas` 1 — 0..1 `ausencias`; `funcionarios` 1 — N `auditoria`.

### Migrações

As migrações ficam em `src/database.js` (array `migracoes`) e são aplicadas automaticamente ao subir a API ou rodar o seed, controladas por `PRAGMA user_version`. Um `banco.db` existente é migrado sem perda de dados: cada médico existente vira um funcionário com `role = 'medico'` (mesmo `id`, então `consultas.medico_id` não muda) e ausências antigas ficam com `notificacao_status = 'enviada'`.

Para adicionar uma migração, inclua uma nova função **no final** do array — nunca altere uma migração já aplicada.

## Perfis de acesso

| Perfil | Agenda (`GET /consultas`) | Registrar ausência | Exportar | Resumo de ausências |
|--------|---------------------------|--------------------|----------|---------------------|
| `medico` | Só a própria | Só nas próprias consultas | Só a própria agenda | Não |
| `recepcao` | Todos os médicos (filtro `medicoId`) | Qualquer consulta | Não | Não |
| `gestor` | Todos os médicos (filtro `medicoId`) | Qualquer consulta | Todos os médicos | Sim |

Rotas sem permissão para o perfil retornam `403`:
```json
{ "erro": "Acesso negado para o seu perfil.", "perfis_permitidos": ["gestor"] }
```

## Como inicializar

**1. Instalar dependências (da raiz do monorepo):**
```bash
npm install
```

**2. Rodar o seed para criar os funcionários e consultas de teste:**
```bash
npm run seed --workspace=apps/api
```

O seed insere os seguintes funcionários com senha hasheada (todos com senha `123456`):

| Email | Perfil | CRM |
|-------|--------|-----|
| ana@clinica.com | medico | CRM-SP-12345 |
| bruno@clinica.com | medico | CRM-SP-67890 |
| recepcao@clinica.com | recepcao | — |
| gestor@clinica.com | gestor | — |

> O seed usa `INSERT OR IGNORE`, então pode ser executado mais de uma vez sem duplicar dados.

**3. Subir o servidor:**
```bash
npm run dev --workspace=apps/api
```

API disponível em `http://localhost:3001`.

## Rotas disponíveis

### Auth

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/api/auth/login` | Login com email e senha | Não |
| `POST` | `/api/auth/logout` | Encerra a sessão | Sim |
| `GET` | `/api/auth/me` | Retorna o funcionário da sessão atual (inclui `role` e `medico_id`) | Sim |

**Body do login:**
```json
{
  "email": "ana@clinica.com",
  "senha": "123456"
}
```

**Resposta do login:**
```json
{ "id": 1, "nome": "Dra. Ana Lima", "role": "medico", "medico_id": 1, "crm": "CRM-SP-12345" }
```

> `id` é o id do funcionário. `medico_id` e `crm` vêm `null` para recepção e gestor. O filtro `medicoId` das rotas usa o `medico_id`.

```json
```

### Consultas

Exige sessão ativa (login realizado).

| Método | Rota | Descrição | Perfis |
|--------|------|-----------|--------|
| `GET` | `/api/consultas` | Lista as consultas da data, com filtro opcional de horário e médico | Todos |
| `GET` | `/api/consultas/export` | Mesmos filtros da listagem, retornando planilha `.xlsx` | `medico`, `gestor` |

**Query params (iguais nas duas rotas):**

| Param | Obrigatório | Formato | Descrição |
|-------|-------------|---------|-----------|
| `data` | Sim | `YYYY-MM-DD` | Dia da agenda |
| `horaInicio` | Não | `HH:mm` | Consultas a partir deste horário (**inclusivo**) |
| `horaFim` | Não | `HH:mm` | Consultas antes deste horário (**exclusivo**) |
| `medicoId` | Não | inteiro | Filtra por médico (recepção e gestor). Para médicos é sempre o próprio id; informar outro retorna `403` |

O filtro de horário é aplicado sobre o horário da consulta (`data_hora`). Sem `horaInicio`/`horaFim` o retorno é o dia inteiro. Exemplo — consultas da manhã: `GET /api/consultas?data=2026-11-25&horaInicio=07:00&horaFim=12:00` (a consulta das 12:00 do seed não entra).

**Erros de validação (`400`):**

| Situação | `erro` |
|----------|--------|
| `data` ausente ou inválida | `Parâmetro data é obrigatório (formato: YYYY-MM-DD).` |
| `horaInicio` inválida | `Parâmetro horaInicio inválido (formato: HH:mm, ex.: 07:00).` |
| `horaFim` inválida | `Parâmetro horaFim inválido (formato: HH:mm, ex.: 12:00).` |
| `horaFim` ≤ `horaInicio` | `horaFim deve ser maior que horaInicio.` |
| `medicoId` inválido | `Parâmetro medicoId deve ser um número inteiro positivo.` |

**Exemplo de resposta da listagem:**
```json
[
  {
    "id": 1,
    "data_hora": "2026-05-16T09:00",
    "status": "ausente",
    "paciente_id": 1,
    "paciente_nome": "João Silva",
    "paciente_telefone": "11991110001",
    "paciente_email": "joao@email.com",
    "medico_id": 1,
    "medico_nome": "Dra. Ana Lima",
    "medico_crm": "CRM-SP-12345",
    "ausencia_registrada_em": "2026-05-15 23:07:41",
    "notificacao_status": "enviada",
    "notificado_em": "2026-05-15 23:07:41"
  }
]
```

> Os campos de ausência/notificação vêm `null` quando a consulta não teve ausência registrada.

#### Exportação (`GET /api/consultas/export`)

Retorna o arquivo com os headers:

```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="consultas-YYYY-MM-DD.xlsx"
```

Colunas da planilha: ID consulta, Data, Horário, Status da consulta, Médico, CRM, Paciente, Telefone, E-mail do paciente, Ausência registrada em, Status da notificação (`não se aplica` quando não houve ausência), Notificado em.

Cada exportação bem-sucedida grava uma linha na tabela `auditoria` com o funcionário, a data/hora e os filtros usados (`acao = 'exportar_consultas'`, `filtros` em JSON). Requisições com erro de validação não são auditadas.

### Ausências

Exige sessão ativa (login realizado).

| Método | Rota | Descrição | Perfis |
|--------|------|-----------|--------|
| `POST` | `/api/ausencias` | Marca o médico como ausente em uma ou mais consultas e notifica os pacientes | Todos (médico só nas próprias consultas) |
| `GET` | `/api/ausencias/resumo` | Total de ausências do mês, agrupado por médico e por dia | `gestor` |

#### `POST /api/ausencias`

O fluxo esperado é usar o retorno do `GET /consultas` (com ou sem filtro de horário) para obter os IDs e enviá-los em lote. Para uma ausência só no período da manhã, por exemplo, liste com `horaInicio=07:00&horaFim=12:00` e envie apenas esses IDs — só esses pacientes são marcados e notificados.

**Body:**
```json
{
  "consulta_ids": [1, 2, 3]
}
```

**Exemplo de resposta:**
```json
{
  "mensagem": "Médico marcado como ausente. 3 paciente(s) notificado(s).",
  "consulta_ids": [1, 2, 3],
  "notificacoes": { "enviadas": 3, "falhas": 0 }
}
```

A mensagem de WhatsApp inclui a data e o horário da consulta cancelada:

```
Olá, João Silva. Sua consulta de 16/05/2026 às 09:00 com Dra. Ana Lima foi cancelada por ausência do médico.
```

> A notificação de WhatsApp é simulada via `console.log` (`src/services/whatsapp.js`). Todas as consultas são atualizadas para `status = 'ausente'` em uma única transação. O resultado de cada envio é gravado em `ausencias.notificacao_status` (`enviada` ou `falha` — ex.: paciente sem telefone).

#### `GET /api/ausencias/resumo?mes=AAAA-MM&medicoId=`

| Param | Obrigatório | Formato |
|-------|-------------|---------|
| `mes` | Sim | `AAAA-MM` |
| `medicoId` | Não | inteiro |

O dia considerado é o dia da consulta afetada (não a data em que a ausência foi registrada).

**Exemplo de resposta:**
```json
{
  "mes": "2026-05",
  "medico_id": null,
  "total": 4,
  "por_medico": [
    {
      "medico_id": 2,
      "medico_nome": "Dr. Bruno Costa",
      "total": 1,
      "por_dia": [{ "dia": "2026-05-16", "total": 1 }]
    },
    {
      "medico_id": 1,
      "medico_nome": "Dra. Ana Lima",
      "total": 3,
      "por_dia": [
        { "dia": "2026-05-16", "total": 2 },
        { "dia": "2026-05-17", "total": 1 }
      ]
    }
  ],
  "por_dia": [
    { "dia": "2026-05-16", "total": 3 },
    { "dia": "2026-05-17", "total": 1 }
  ]
}
```

Erros: `400` para `mes` ausente/inválido ou `medicoId` inválido; `403` para perfis diferentes de `gestor`.
