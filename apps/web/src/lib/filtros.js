import { formatDate } from './format'

// Texto do filtro aplicado, ex.: "23 de novembro de 2026 · 07:00 até 12:00 · Dra. Ana Lima"
export function descreverFiltro(filters, medicos) {
  const partes = [formatDate(filters.data)]
  if (filters.horaInicio || filters.horaFim) {
    partes.push(`${filters.horaInicio || '00:00'} até ${filters.horaFim || '23:59'}`)
  }
  if (filters.medicoId) {
    const medico = medicos.find((item) => String(item.id) === String(filters.medicoId))
    if (medico) partes.push(medico.nome)
  }
  return partes.join(' · ')
}
