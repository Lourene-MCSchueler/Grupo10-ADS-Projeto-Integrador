import { useCallback, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AgendaFilters } from '../components/AgendaFilters'
import { AppointmentList } from '../components/AppointmentList'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PageHeader } from '../components/ui'
import { useAppointments } from '../hooks/useAppointments'
import { useMedicos } from '../hooks/useMedicos'
import { request } from '../lib/api'
import { descreverFiltro } from '../lib/filtros'
import { formatShortDate, formatTime, todayISO } from '../lib/format'

// Mesmo texto montado pela API em src/services/whatsapp.js
function previaMensagem(consulta) {
  return (
    `Olá, ${consulta.paciente_nome}. Sua consulta de ${formatShortDate(consulta.data_hora)} ` +
    `às ${formatTime(consulta.data_hora)} com ${consulta.medico_nome} foi cancelada por ausência do médico.`
  )
}

export function RegistrarAusencia() {
  const { pode } = useAuth()
  const [filters, setFilters] = useState({ data: todayISO(), horaInicio: '', horaFim: '', medicoId: '' })
  const [selectedIds, setSelectedIds] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { appointments, loading, error, reload } = useAppointments(filters)
  const medicos = useMedicos(pode.verTodosMedicos)

  const agendadas = appointments.filter((item) => item.status === 'agendada')
  const selecionadas = appointments.filter((item) => selectedIds.includes(item.id))
  const medicosAfetados = [...new Set(selecionadas.map((item) => item.medico_nome))]
  const semTelefone = selecionadas.filter((item) => !item.paciente_telefone).length

  function handleApply(next) {
    setFilters(next)
    setSelectedIds([])
    setFeedback(null)
  }

  function toggleAppointment(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function toggleAll(select) {
    setSelectedIds(select ? agendadas.map((item) => item.id) : [])
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!selectedIds.length) {
      setFeedback({ type: 'error', text: 'Selecione pelo menos uma consulta agendada.' })
      return
    }
    setFeedback(null)
    setConfirming(true)
  }

  // Cancelar mantém a tela com as seleções
  const cancelConfirm = useCallback(() => setConfirming(false), [])

  async function confirmAbsence() {
    setSubmitting(true)
    try {
      const data = await request('/api/ausencias', {
        method: 'POST',
        body: JSON.stringify({ consulta_ids: selectedIds }),
      })
      setFeedback({
        type: data.notificacoes?.falhas ? 'warning' : 'success',
        title: 'Ausência médica registrada com sucesso!',
        text: data.mensagem,
      })
      setSelectedIds([])
      await reload()
    } catch (err) {
      setFeedback({ type: 'error', text: err.message })
    } finally {
      setSubmitting(false)
      setConfirming(false)
    }
  }

  return (
    <main className="content">
      <PageHeader
        description="Filtre o dia e, se a ausência for só por algumas horas, o intervalo de horário. Depois selecione as consultas afetadas."
        eyebrow="Fluxo principal"
        title="Registrar ausência médica"
      />

      <AgendaFilters
        loading={loading}
        medicos={medicos}
        onApply={handleApply}
        showMedico={pode.verTodosMedicos}
        value={filters}
      />

      <section className="split-grid wide-left">
        <form className="panel absence-panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <div>
              <h2>Consultas afetadas</h2>
              <p className="muted">{descreverFiltro(filters, medicos)}</p>
            </div>
            <span className="muted">
              {selectedIds.length} de {agendadas.length} agendada(s) selecionada(s)
            </span>
          </div>

          {loading && <p className="muted">Carregando consultas...</p>}
          {error && <p className="alert error">{error}</p>}
          {!loading && !error && (
            <AppointmentList
              appointments={appointments}
              onToggle={toggleAppointment}
              onToggleAll={toggleAll}
              selectable
              selectedIds={selectedIds}
              showMedico={pode.verTodosMedicos}
            />
          )}

          {feedback && (
            <div className={`alert ${feedback.type}`} role="status">
              {feedback.title && <strong>{feedback.title}</strong>}
              <span>{feedback.text}</span>
            </div>
          )}

          <button
            className="primary-button submit-action"
            disabled={submitting || !selectedIds.length}
            type="submit"
          >
            {`Registrar ausência (${selectedIds.length})`}
          </button>
        </form>

        <aside className="panel process-panel">
          <span className="eyebrow">O que acontece depois</span>
          <ol className="process-list">
            <li>
              <strong>Confirmação</strong>
              <span>Você revisa as consultas e a mensagem antes de registrar.</span>
            </li>
            <li>
              <strong>Status atualizado</strong>
              <span>As consultas selecionadas passam de agendada para ausente.</span>
            </li>
            <li>
              <strong>Pacientes avisados</strong>
              <span>
                Cada paciente recebe a mensagem no WhatsApp. O sistema guarda se o aviso foi enviado
                ou falhou.
              </span>
            </li>
            <li>
              <strong>Gestão acompanha</strong>
              <span>O gestor vê as ausências e as falhas de envio no relatório do mês.</span>
            </li>
          </ol>
        </aside>
      </section>

      {confirming && (
        <ConfirmDialog
          busy={submitting}
          onCancel={cancelConfirm}
          onConfirm={confirmAbsence}
          title="Deseja confirmar o registro de ausência do médico?"
        >
          <ul className="confirm-summary">
            <li>
              <strong>{selecionadas.length}</strong> consulta(s) serão canceladas
            </li>
            <li>
              Médico(s): <strong>{medicosAfetados.join(', ')}</strong>
            </li>
            <li>
              Horários:{' '}
              <strong>{selecionadas.map((item) => formatTime(item.data_hora)).join(', ')}</strong>
            </li>
          </ul>
          {semTelefone > 0 && (
            <p className="alert warning">
              {semTelefone} paciente(s) sem telefone cadastrado não receberão o aviso.
            </p>
          )}
          {selecionadas[0] && (
            <figure className="message-preview">
              <figcaption>Mensagem que o paciente vai receber</figcaption>
              <blockquote>{previaMensagem(selecionadas[0])}</blockquote>
            </figure>
          )}
        </ConfirmDialog>
      )}
    </main>
  )
}
