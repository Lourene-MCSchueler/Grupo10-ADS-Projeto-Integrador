import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AgendaFilters } from '../components/AgendaFilters'
import { AppointmentList } from '../components/AppointmentList'
import { PageHeader } from '../components/ui'
import { useAppointments } from '../hooks/useAppointments'
import { useMedicos } from '../hooks/useMedicos'
import { buildQuery, downloadFile } from '../lib/api'
import { descreverFiltro } from '../lib/filtros'
import { todayISO } from '../lib/format'
import { PERFIS } from '../lib/perfis'

export function Agenda() {
  const { user, pode } = useAuth()
  const [filters, setFilters] = useState({ data: todayISO(), horaInicio: '', horaFim: '', medicoId: '' })
  const { appointments, loading, error } = useAppointments(filters)
  const medicos = useMedicos(pode.verTodosMedicos)
  const [exporting, setExporting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  function handleApply(next) {
    setFeedback(null)
    setFilters(next)
  }

  async function handleExport() {
    setExporting(true)
    setFeedback(null)
    try {
      const fileName = await downloadFile(
        `/api/consultas/export${buildQuery(filters)}`,
        `consultas-${filters.data}.xlsx`,
      )
      setFeedback({
        type: 'success',
        text: `Planilha ${fileName} baixada. A exportação ficou registrada na auditoria.`,
      })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message })
    } finally {
      setExporting(false)
    }
  }

  return (
    <main className="content">
      <PageHeader
        description="Filtre por dia e horário para ver as consultas e o status do aviso de cada paciente."
        eyebrow={PERFIS[user.role]?.agendaEscopo}
        title="Agenda"
      />

      <AgendaFilters
        loading={loading}
        medicos={medicos}
        onApply={handleApply}
        showMedico={pode.verTodosMedicos}
        value={filters}
      >
        {pode.exportar && (
          <button className="secondary-button" disabled={exporting || loading} onClick={handleExport} type="button">
            {exporting ? 'Gerando planilha...' : 'Exportar Excel (.xlsx)'}
          </button>
        )}
      </AgendaFilters>

      {feedback && (
        <p className={`alert ${feedback.type}`} role="status">
          {feedback.text}
        </p>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{descreverFiltro(filters, medicos)}</h2>
            <p className="muted">{appointments.length} consulta(s) encontrada(s)</p>
          </div>
          {loading && <span className="muted">Carregando...</span>}
        </div>
        {error ? (
          <p className="alert error">{error}</p>
        ) : (
          <AppointmentList appointments={appointments} showMedico={pode.verTodosMedicos} />
        )}
      </section>
    </main>
  )
}
