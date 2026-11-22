import { formatTime } from '../lib/format'
import { STATUS_CONSULTA, STATUS_NOTIFICACAO } from '../lib/perfis'
import { EmptyState, StatusPill } from './ui'

export function AppointmentList({
  appointments,
  selectable = false,
  selectedIds = [],
  onToggle,
  onToggleAll,
  showMedico = false,
  emptyText = 'Escolha outra data ou outro intervalo de horário.',
}) {
  if (!appointments.length) {
    return <EmptyState title="Nenhuma consulta encontrada" text={emptyText} />
  }

  const selecionaveis = appointments.filter((item) => item.status === 'agendada')
  const allSelected =
    selecionaveis.length > 0 && selecionaveis.every((item) => selectedIds.includes(item.id))
  const classes = ['appointment-list', selectable && 'is-selectable', showMedico && 'with-medico']

  return (
    <div className={classes.filter(Boolean).join(' ')}>
      <div className="appointment-header">
        {selectable && (
          <input
            aria-label="Selecionar todas as consultas agendadas"
            checked={allSelected}
            disabled={!selecionaveis.length}
            onChange={() => onToggleAll(!allSelected)}
            type="checkbox"
          />
        )}
        {selectable && (
          <span aria-hidden="true" className="select-all-label">
            Selecionar todas
          </span>
        )}
        <span>Horário</span>
        <span>Paciente / WhatsApp</span>
        {showMedico && <span>Médico</span>}
        <span>Status</span>
      </div>

      {appointments.map((appointment) => {
        const checked = selectedIds.includes(appointment.id)
        const disabled = appointment.status !== 'agendada'
        const status = STATUS_CONSULTA[appointment.status]
        const aviso = STATUS_NOTIFICACAO[appointment.notificacao_status]
        const Row = selectable ? 'label' : 'div'

        return (
          <Row
            className={['appointment-row', checked && 'selected', selectable && disabled && 'locked']
              .filter(Boolean)
              .join(' ')}
            key={appointment.id}
          >
            {selectable && (
              <input
                aria-label={`Selecionar consulta de ${appointment.paciente_nome} às ${formatTime(appointment.data_hora)}`}
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(appointment.id)}
                type="checkbox"
              />
            )}
            <span className="time-block">{formatTime(appointment.data_hora)}</span>
            <span className="patient-block">
              <strong>{appointment.paciente_nome}</strong>
              <small>{appointment.paciente_telefone || 'Telefone não informado'}</small>
            </span>
            {showMedico && (
              <span className="medico-block">
                <strong>{appointment.medico_nome}</strong>
                <small>{appointment.medico_crm}</small>
              </span>
            )}
            <span className="status-stack">
              <StatusPill tone={status?.tone}>{status?.label || appointment.status}</StatusPill>
              {aviso && (
                <StatusPill icon={aviso.icon} tone={aviso.tone}>
                  {aviso.label}
                </StatusPill>
              )}
            </span>
          </Row>
        )
      })}
    </div>
  )
}
