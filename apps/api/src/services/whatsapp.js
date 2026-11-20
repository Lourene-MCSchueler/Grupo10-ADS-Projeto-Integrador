// Envio simulado via console.log. Ao integrar a WhatsApp API, manter a assinatura:
// enviarAviso(consulta) retorna true quando enviado e lança erro em caso de falha.

function formatarDataHora(dataHora) {
  const [data, hora] = dataHora.split('T');
  const [ano, mes, dia] = data.split('-');
  return { data: `${dia}/${mes}/${ano}`, hora: hora.slice(0, 5) };
}

function montarMensagem(consulta) {
  const { data, hora } = formatarDataHora(consulta.data_hora);
  return (
    `Olá, ${consulta.paciente_nome}. Sua consulta de ${data} às ${hora} ` +
    `com ${consulta.medico_nome} foi cancelada por ausência do médico.`
  );
}

function enviarAviso(consulta) {
  if (!consulta.paciente_telefone) {
    throw new Error('Paciente sem telefone cadastrado.');
  }
  console.log(`[WhatsApp] Para ${consulta.paciente_telefone}: ${montarMensagem(consulta)}`);
  return true;
}

module.exports = { montarMensagem, enviarAviso };
