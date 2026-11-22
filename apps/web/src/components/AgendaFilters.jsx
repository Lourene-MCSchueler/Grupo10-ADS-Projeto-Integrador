import { useState } from 'react'
import { PERIODOS } from '../lib/perfis'

// Filtro combinado: data + intervalo de horário (+ médico para recepção e gestor).
// Mantém um rascunho e só aplica ao clicar em "Buscar" ou num atalho de período.
export function AgendaFilters({ value, onApply, medicos, showMedico, loading, children }) {
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState('')

  function update(field, fieldValue) {
    setDraft((current) => ({ ...current, [field]: fieldValue }))
  }

  function apply(next) {
    if (!next.data) {
      setError('Informe a data.')
      return
    }
    if (next.horaInicio && next.horaFim && next.horaFim <= next.horaInicio) {
      setError('O horário final deve ser maior que o inicial.')
      return
    }
    setError('')
    onApply(next)
  }

  function handleSubmit(event) {
    event.preventDefault()
    apply(draft)
  }

  function applyPeriodo(periodo) {
    const next = { ...draft, horaInicio: periodo.horaInicio, horaFim: periodo.horaFim }
    setDraft(next)
    apply(next)
  }

  const periodoAtivo = PERIODOS.find(
    (p) => p.horaInicio === (value.horaInicio || '') && p.horaFim === (value.horaFim || ''),
  )?.id

  return (
    <form className="panel filter-panel" onSubmit={handleSubmit} aria-label="Filtros da agenda">
      <div className="filter-grid">
        <label>
          Data
          <input
            onChange={(event) => update('data', event.target.value)}
            required
            type="date"
            value={draft.data}
          />
        </label>
        <label>
          Hora início
          <input
            onChange={(event) => update('horaInicio', event.target.value)}
            type="time"
            value={draft.horaInicio}
          />
        </label>
        <label>
          Hora fim
          <input
            onChange={(event) => update('horaFim', event.target.value)}
            type="time"
            value={draft.horaFim}
          />
        </label>
        {showMedico && (
          <label>
            Médico
            <select
              onChange={(event) => update('medicoId', event.target.value)}
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
        )}
        <button className="primary-button" disabled={loading} type="submit">
          Buscar
        </button>
      </div>

      <div className="filter-footer">
        <div className="chip-row" role="group" aria-label="Atalhos de período">
          {PERIODOS.map((periodo) => (
            <button
              aria-pressed={periodoAtivo === periodo.id}
              className={periodoAtivo === periodo.id ? 'chip active' : 'chip'}
              key={periodo.id}
              onClick={() => applyPeriodo(periodo)}
              type="button"
            >
              {periodo.label}
              {periodo.horaInicio && (
                <small>
                  {periodo.horaInicio}-{periodo.horaFim}
                </small>
              )}
            </button>
          ))}
        </div>
        {children && <div className="filter-actions">{children}</div>}
      </div>

      {error && <p className="alert error">{error}</p>}
    </form>
  )
}
