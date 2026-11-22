// Regras de acesso por perfil — espelham a tabela "Perfis de acesso" do README da API.
export const PERFIS = {
  medico: {
    label: 'Médico',
    painel: 'Painel do médico',
    agendaEscopo: 'Sua agenda',
  },
  recepcao: {
    label: 'Recepção',
    painel: 'Painel da recepção',
    agendaEscopo: 'Agenda de todos os médicos',
  },
  gestor: {
    label: 'Gestor',
    painel: 'Painel do gestor',
    agendaEscopo: 'Agenda de todos os médicos',
  },
}

export function permissoes(role) {
  return {
    verTodosMedicos: role === 'recepcao' || role === 'gestor',
    exportar: role === 'medico' || role === 'gestor',
    verResumo: role === 'gestor',
  }
}

export const STATUS_CONSULTA = {
  agendada: { label: 'Agendada', tone: 'info' },
  realizada: { label: 'Realizada', tone: 'success' },
  ausente: { label: 'Ausente', tone: 'warning' },
}

export const STATUS_NOTIFICACAO = {
  enviada: { label: 'Aviso enviado', tone: 'success', icon: '✓' },
  falha: { label: 'Falha no aviso', tone: 'danger', icon: '!' },
  pendente: { label: 'Aviso pendente', tone: 'neutral', icon: '…' },
}

// Atalhos do filtro de horário (horaFim é exclusivo na API: 12:00 já é tarde).
export const PERIODOS = [
  { id: 'dia', label: 'Dia inteiro', horaInicio: '', horaFim: '' },
  { id: 'manha', label: 'Manhã', horaInicio: '07:00', horaFim: '12:00' },
  { id: 'tarde', label: 'Tarde', horaInicio: '12:00', horaFim: '20:00' },
]
