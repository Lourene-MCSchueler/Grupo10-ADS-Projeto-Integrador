import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AppointmentList } from '../components/AppointmentList'
import { MetricCard, PageHeader } from '../components/ui'
import { useAppointments } from '../hooks/useAppointments'
import { useRelatorio } from '../hooks/useRelatorio'
import { currentMonth, formatDate, formatMonth, formatTime, todayISO } from '../lib/format'
import { PERFIS } from '../lib/perfis'

const DESCRICOES = {
  medico: 'Suas consultas de hoje e os pacientes que seriam afetados por uma ausência.',
  recepcao: 'Consultas de hoje de todos os médicos da clínica.',
  gestor: 'Consultas de hoje e um resumo das ausências do mês.',
}

function ResumoGestor() {
  const mes = currentMonth()
  const { resumo, enviadas, falhas, loading, error } = useRelatorio({ mes })

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Ausências em {formatMonth(mes)}</h2>
          <p className="muted">Pacientes afetados e situação dos avisos enviados</p>
        </div>
        <Link className="secondary-button" to="/relatorio">
          Ver relatório
        </Link>
      </div>
      {error ? (
        <p className="alert error">{error}</p>
      ) : (
        <div className="metric-grid four">
          <MetricCard label="Consultas canceladas" value={loading ? '…' : (resumo?.total ?? 0)} />
          <MetricCard label="Médicos com ausência" value={loading ? '…' : (resumo?.por_medico.length ?? 0)} />
          <MetricCard label="Avisos enviados" tone="success" value={loading ? '…' : enviadas} />
          <MetricCard
            hint={falhas ? 'A recepção precisa ligar para esses pacientes' : undefined}
            label="Falhas de envio"
            tone={falhas ? 'danger' : undefined}
            value={loading ? '…' : falhas}
          />
        </div>
      )}
    </section>
  )
}

export function Dashboard() {
  const { user, pode } = useAuth()
  const location = useLocation()
  const today = todayISO()
  const filters = useMemo(() => ({ data: today }), [today])
  const { appointments, loading, error } = useAppointments(filters)

  const totalScheduled = appointments.filter((item) => item.status === 'agendada').length
  const totalAbsent = appointments.filter((item) => item.status === 'ausente').length
  const nextAppointment = appointments.find((item) => item.status === 'agendada')

  return (
    <main className="content">
      <PageHeader
        description={DESCRICOES[user.role]}
        eyebrow={formatDate(today)}
        title={PERFIS[user.role]?.painel || 'Painel'}
      />

      {location.state?.autenticado && (
        <p className="alert success" role="status">
          Usuário autenticado. Bem-vindo(a), {user.nome}!
        </p>
      )}

      <section className="metric-grid" aria-label="Resumo da agenda de hoje">
        <MetricCard accent label="Consultas hoje" value={appointments.length} />
        <MetricCard label="Agendadas" value={totalScheduled} />
        <MetricCard label="Ausências registradas" value={totalAbsent} />
      </section>

      {pode.verResumo && <ResumoGestor />}

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Agenda de hoje</h2>
              <p className="muted">{PERFIS[user.role]?.agendaEscopo}, em ordem de horário</p>
            </div>
            {loading && <span className="muted">Atualizando...</span>}
          </div>
          {error ? (
            <p className="alert error">{error}</p>
          ) : (
            <AppointmentList
              appointments={appointments}
              emptyText="Não há consultas hoje. Use a Agenda para ver outros dias."
              showMedico={pode.verTodosMedicos}
            />
          )}
        </article>

        <article className="next-panel">
          <span className="eyebrow">Próxima consulta</span>
          {nextAppointment ? (
            <>
              <h2>{formatTime(nextAppointment.data_hora)}</h2>
              <p>{nextAppointment.paciente_nome}</p>
              <small>
                {pode.verTodosMedicos ? `${nextAppointment.medico_nome} · ` : ''}
                {nextAppointment.paciente_telefone || 'Telefone não informado'}
              </small>
            </>
          ) : (
            <>
              <h2>Agenda livre</h2>
              <p>Não há consultas agendadas pendentes para hoje.</p>
            </>
          )}
          <Link className="primary-button inline-action" to="/ausencia">
            Registrar ausência
          </Link>
          <Link className="text-link" to="/agenda">
            Ver agenda de outros dias
          </Link>
        </article>
      </section>
    </main>
  )
}
