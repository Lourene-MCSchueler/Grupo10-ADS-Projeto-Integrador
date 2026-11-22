import { useCallback, useEffect, useState } from 'react'
import { buildQuery, request } from '../lib/api'

// filters: { data, horaInicio, horaFim, medicoId }
export function useAppointments(filters) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!filters?.data) return

    setLoading(true)
    setError('')
    try {
      const data = await request(`/api/consultas${buildQuery(filters)}`)
      setAppointments(Array.isArray(data) ? data : [])
    } catch (err) {
      setAppointments([])
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    reload()
  }, [reload])

  return { appointments, loading, error, reload }
}
