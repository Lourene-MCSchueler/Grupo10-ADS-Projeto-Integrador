import { useState } from 'react'
import { BarList } from '../components/BarList'
import { EmptyState, MetricCard, PageHeader, StatusPill } from '../components/ui'
import { useMedicos } from '../hooks/useMedicos'
import { useRelatorio } from '../hooks/useRelatorio'
import { currentMonth, formatDateTime, formatMonth, formatShortDate, formatTime, formatWeekday } from '../lib/format'
import { STATUS_NOTIFICACAO } from '../lib/perfis'

const FILTROS_AVISO = [
  { id: 'todos', label: 'Todos' },
  { id: 'enviada', label: 'Enviados' },
  { id: 'falha', label: 'Falhas' },
]

// Jornada do gestor: acompanhar as ausências do mês, os pacientes avisados
// e as falhas de envio que a recepção precisa resolver por telefone.
export function RelatorioAusencias() {
  const [draft, setDraft] = useState({ mes: currentMonth(), medicoId: '' })
  const [filters, setFilters] = useState(draft)
  const [filtroAviso, setFiltroAviso] = useState('todos')
  const medicos = useMedicos(true)
  const { resumo, ausencias, enviadas, falhas, loading, error } = useRelatorio(filters)

  function handleSubmit(event) {
    event.preventDefault()
    if (draft.mes) setFilters(draft)
  }

  const porMedico = (resumo?.por_medico || [])
    .map((item) => ({
      key: item.medico_id,
      label: item.medico_nome,
      sub: `${item.por_dia.length} dia(s) com ausência`,
      value: item.total,
    }))
    .sort((a, b) => b.value - a.value)

  const porDia = (resumo?.por_dia || []).map((item) => ({
    key: item.dia,
    label: formatShortDate(item.dia),
    sub: formatWeekday(item.dia),
    value: item.total,
  }))

  const listaAvisos =
    filtroAviso === 'todos' ? ausencias : ausencias.filter((item) => item.notificacao_status === filtroAviso)

  const contagem = { todos: ausencias.length, enviada: enviadas, falha: falhas }

  return (
    <main className="content">
      <PageHeader
        description="Total de ausências do mês por médico e por dia, e a situação do aviso de cada paciente."
        eyebrow="Gestão da clínica"
        title="Relatório de ausências"
      />

      <form className="panel filter-panel" onSubmit={handleSubmit} aria-label="Filtros do relatório">
        <div className="filter-grid report">
          <label>
            Mês
            <input
              onChange={(event) => setDraft((current) => ({ ...current, mes: event.target.value }))}
              required
              type="month"
              value={draft.mes}
            />
          </label>
          <label>
            Médico
            <select
              onChange={(event) => setDraft((current) => ({ ...current, medicoId: event.target.value }))}
              value={draft.medicoId}
            >
              <option value="">Todos os médicos</option>
              {medicos.map((medico) => (
                <option key={medico.id} value={medico.id}>
                  {medico.nome}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" disabled={loading} type="submit">
            Atualizar
          </button>
        </div>
      </form>

      {error && <p className="alert error">{error}</p>}

      <section className="metric-grid four" aria-label={`Resumo de ${formatMonth(filters.mes)}`}>
        <MetricCard accent label="Consultas canceladas" value={resumo?.total ?? 0} hint={formatMonth(filters.mes)} />
        <MetricCard label="Médicos com ausência" value={resumo?.por_medico.length ?? 0} />
        <MetricCard label="Avisos enviados" tone="success" value={enviadas} />
        <MetricCard
          hint={falhas ? 'Pacientes que precisam de contato por telefone' : 'Nenhuma falha no mês'}
          label="Falhas de envio"
          tone={falhas ? 'danger' : undefined}
          value={falhas}
        />
      </section>

      <section className="split-grid even">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Ausências por médico</h2>
              <p className="muted">Consultas canceladas no mês</p>
            </div>
          </div>
          <BarList emptyText="Nenhuma ausência registrada no mês." items={porMedico} unit="consulta(s)" />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Ausências por dia</h2>
              <p className="muted">Dia da consulta afetada</p>
            </div>
          </div>
          <BarList emptyText="Nenhuma ausência registrada no mês." items={porDia} unit="consulta(s)" />
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Avisos aos pacientes</h2>
            <p className="muted">Quem foi avisado pelo WhatsApp e quando</p>
          </div>
          <div className="chip-row" role="group" aria-label="Filtrar por status do aviso">
            {FILTROS_AVISO.map((filtro) => (
              <button
                aria-pressed={filtroAviso === filtro.id}
                className={filtroAviso === filtro.id ? 'chip active' : 'chip'}
                key={filtro.id}
                onClick={() => setFiltroAviso(filtro.id)}
                type="button"
              >
                {filtro.label} <small>{contagem[filtro.id]}</small>
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="muted">Carregando...</p>}
        {!loading && !listaAvisos.length && (
          <EmptyState
            title="Nenhum aviso nesta lista"
            text={ausencias.length ? 'Troque o filtro de status.' : 'Não houve ausências no período escolhido.'}
          />
        )}
        {!loading && listaAvisos.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Consulta</th>
                  <th scope="col">Médico</th>
                  <th scope="col">Paciente</th>
                  <th scope="col">WhatsApp</th>
                  <th scope="col">Aviso</th>
                  <th scope="col">Registrada em</th>
                  <th scope="col">Notificado em</th>
                </tr>
              </thead>
              <tbody>
                {listaAvisos.map((item) => {
                  const aviso = STATUS_NOTIFICACAO[item.notificacao_status]
                  return (
                    <tr className={item.notificacao_status === 'falha' ? 'row-alert' : undefined} key={item.id}>
                      <td>
                        <strong>{formatShortDate(item.data_hora)}</strong> {formatTime(item.data_hora)}
                      </td>
                      <td>{item.medico_nome}</td>
                      <td>{item.paciente_nome}</td>
                      <td>{item.paciente_telefone || 'Não informado'}</td>
                      <td>
                        <StatusPill icon={aviso?.icon} tone={aviso?.tone}>
                          {aviso?.label || item.notificacao_status}
                        </StatusPill>
                      </td>
                      <td>{formatDateTime(item.registrada_em)}</td>
                      <td>{formatDateTime(item.notificado_em)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
