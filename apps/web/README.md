# Web — MediControlRegister

Front em React + Vite. Consome a API de `apps/api` (veja o README de lá para rotas e regras).

## Rodando localmente

Na raiz do repositório, com a API já rodando (`npm run dev --workspace=apps/api`):

```bash
npm run dev --workspace web
```

O Vite sobe em `http://localhost:5173`. As chamadas usam o prefixo `/api`, e o Vite faz proxy para `http://localhost:3001`.

Em modo dev, a tela de login mostra botões de **Contas de teste** (médica, recepção, gestor) que preenchem e-mail e senha.

| Login | Perfil |
|-------|--------|
| ana@clinica.com / bruno@clinica.com | médico |
| recepcao@clinica.com | recepção |
| gestor@clinica.com | gestor |

Senha de todos: `123456`. As consultas de teste estão em 23, 24 e 25/11/2026, de manhã e de tarde.

## Telas por perfil

| Tela | Rota | Médico | Recepção | Gestor |
|------|------|--------|----------|--------|
| Login | `/` | ✓ | ✓ | ✓ |
| Painel (agenda de hoje) | `/dashboard` | só a própria | todos os médicos | todos + resumo do mês |
| Agenda (filtro data + horário) | `/agenda` | só a própria | todos (filtro por médico) | todos (filtro por médico) |
| Exportar Excel (.xlsx) | botão na Agenda | ✓ | — | ✓ |
| Registrar ausência | `/ausencia` | só as próprias consultas | qualquer consulta | qualquer consulta |
| Relatório de ausências | `/relatorio` | — | — | ✓ |

O menu só mostra o que o perfil pode usar, e `/relatorio` redireciona para o painel quem não é gestor. A API também valida tudo (403), então o front não é a única barreira.

### Filtro combinado de data e horário

Agenda e Registrar ausência usam o mesmo filtro: **data + hora início + hora fim** (+ **médico** para recepção e gestor). Os atalhos **Dia inteiro**, **Manhã (07:00-12:00)** e **Tarde (12:00-20:00)** aplicam o filtro direto. A hora fim é exclusiva, como na API: "Manhã" não traz a consulta das 12:00.

Para uma ausência parcial: filtre o período, marque **selecionar todas** no cabeçalho da lista e registre. Só esses pacientes são avisados.

### Registro de ausência (Jornada Chave do documento)

1. Filtrar a agenda e selecionar as consultas (checkbox por linha + selecionar todas no cabeçalho).
2. **Registrar ausência** abre a confirmação *"Deseja confirmar o registro de ausência do médico?"* com o resumo (quantidade, médicos, horários) e uma prévia da mensagem do WhatsApp.
3. **Cancelar** mantém a tela com as seleções. **Confirmar** chama `POST /api/ausencias` e mostra *"Ausência médica registrada com sucesso!"* com o total de avisos enviados e falhas.
4. As consultas passam a mostrar **Ausente** e o selo do aviso (**Aviso enviado** / **Falha no aviso**).

### Jornada do gestor

- **Painel:** além da agenda de hoje, mostra os números do mês (consultas canceladas, médicos com ausência, avisos enviados, falhas de envio).
- **Relatório de ausências** (`/relatorio`): filtro por mês e médico; totais por médico e por dia (barras); tabela **Avisos aos pacientes** com paciente, WhatsApp, status do envio e horários. O filtro **Falhas** lista quem não recebeu o aviso, para a recepção ligar.
- **Exportação:** na Agenda, o gestor baixa a planilha de qualquer médico. Toda exportação fica registrada na auditoria da API.

## Estrutura

```
src/
├── App.jsx                  # Rotas (AppShell é a rota de layout das telas logadas)
├── auth/
│   ├── AuthContext.js       # useAuth(): user, login, logout, pode (permissões)
│   ├── AuthProvider.jsx
│   └── ProtectedRoute.jsx   # exige login; aceita roles={['gestor']}
├── components/
│   ├── AppShell.jsx         # sidebar + menu por perfil
│   ├── AgendaFilters.jsx    # data + horário + médico + atalhos de período
│   ├── AppointmentList.jsx  # lista com seleção, coluna de médico e status do aviso
│   ├── BarList.jsx          # barras do relatório
│   ├── ConfirmDialog.jsx
│   └── ui.jsx               # PageHeader, EmptyState, StatusPill, MetricCard
├── hooks/
│   ├── useAppointments.js   # GET /api/consultas
│   ├── useMedicos.js        # GET /api/medicos
│   └── useRelatorio.js      # GET /api/ausencias/resumo + GET /api/ausencias
├── lib/
│   ├── api.js               # request(), downloadFile(), buildQuery()
│   ├── filtros.js
│   ├── format.js            # datas e horários em pt-BR
│   └── perfis.js            # permissões por perfil, status e períodos
└── pages/
    ├── Login.jsx
    ├── Dashboard.jsx
    ├── Agenda.jsx
    ├── RegistrarAusencia.jsx
    └── RelatorioAusencias.jsx
```

As permissões ficam em `lib/perfis.js` (`permissoes(role)`) e espelham a tabela "Perfis de acesso" do README da API. Se mudar uma regra na API, mude lá também.
