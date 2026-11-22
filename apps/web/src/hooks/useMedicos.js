import { useEffect, useState } from 'react'
import { request } from '../lib/api'

// Lista de médicos para o filtro (só carrega quando o perfil pode ver todos).
export function useMedicos(enabled) {
  const [medicos, setMedicos] = useState([])

  useEffect(() => {
    if (!enabled) return
    request('/api/medicos')
      .then((data) => setMedicos(Array.isArray(data) ? data : []))
      .catch(() => setMedicos([]))
  }, [enabled])

  return medicos
}
