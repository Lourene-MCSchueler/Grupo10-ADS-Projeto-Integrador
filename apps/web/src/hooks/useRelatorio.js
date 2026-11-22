import { useCallback, useEffect, useState } from 'react'
import { buildQuery, request } from '../lib/api'

// Dados do gestor: resumo mensal (totais por médico e por dia) + lista de ausências
// com o status de envio do aviso de cada paciente.
export function useRelatorio({ mes, medicoId }) {
  const [resumo, setResumo] = useState(null)
  const [ausencias, setAusencias] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!mes) return

    const query = buildQuery({ mes, medicoId })
    setLoading(true)
    setError('')
    try {
      const [resumoData, ausenciasData] = await Promise.all([
        request(`/api/ausencias/resumo${query}`),
        request(`/api/ausencias${query}`),
      ])
      setResumo(resumoData)
      setAusencias(Array.isArray(ausenciasData) ? ausenciasData : [])
    } catch (err) {
      setResumo(null)
      setAusencias([])
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [mes, medicoId])

  useEffect(() => {
    reload()
  }, [reload])

  const enviadas = ausencias.filter((item) => item.notificacao_status === 'enviada').length
  const falhas = ausencias.filter((item) => item.notificacao_status === 'falha').length

  return { resumo, ausencias, enviadas, falhas, loading, error, reload }
}
