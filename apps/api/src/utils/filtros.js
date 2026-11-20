const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const REGEX_MES = /^\d{4}-(0[1-9]|1[0-2])$/;

function idValido(valor) {
  return /^[1-9]\d*$/.test(String(valor));
}

// Valida os filtros da agenda (data, horaInicio, horaFim, medicoId).
// Retorna { erro } ou { filtros } já normalizados.
// Médicos só enxergam a própria agenda; recepção e gestor podem filtrar por medicoId.
function validarFiltrosConsulta(query, session) {
  const { data, horaInicio, horaFim, medicoId } = query;

  if (!data || !REGEX_DATA.test(data)) {
    return { erro: 'Parâmetro data é obrigatório (formato: YYYY-MM-DD).' };
  }
  if (horaInicio !== undefined && !REGEX_HORA.test(horaInicio)) {
    return { erro: 'Parâmetro horaInicio inválido (formato: HH:mm, ex.: 07:00).' };
  }
  if (horaFim !== undefined && !REGEX_HORA.test(horaFim)) {
    return { erro: 'Parâmetro horaFim inválido (formato: HH:mm, ex.: 12:00).' };
  }
  if (horaInicio !== undefined && horaFim !== undefined && horaFim <= horaInicio) {
    return { erro: 'horaFim deve ser maior que horaInicio.' };
  }
  if (medicoId !== undefined && !idValido(medicoId)) {
    return { erro: 'Parâmetro medicoId deve ser um número inteiro positivo.' };
  }

  const filtros = { data, horaInicio: horaInicio ?? null, horaFim: horaFim ?? null, medicoId: null };

  if (session.role === 'medico') {
    if (medicoId !== undefined && Number(medicoId) !== session.medicoId) {
      return { erro: 'Médicos só podem consultar a própria agenda.', status: 403 };
    }
    filtros.medicoId = session.medicoId;
  } else if (medicoId !== undefined) {
    filtros.medicoId = Number(medicoId);
  }

  return { filtros };
}

function validarFiltrosResumo(query) {
  const { mes, medicoId } = query;

  if (!mes || !REGEX_MES.test(mes)) {
    return { erro: 'Parâmetro mes é obrigatório (formato: AAAA-MM).' };
  }
  if (medicoId !== undefined && !idValido(medicoId)) {
    return { erro: 'Parâmetro medicoId deve ser um número inteiro positivo.' };
  }

  return { filtros: { mes, medicoId: medicoId !== undefined ? Number(medicoId) : null } };
}

module.exports = { validarFiltrosConsulta, validarFiltrosResumo };
