import { useCallback, useEffect, useMemo, useState } from 'react'
import { request } from '../lib/api'
import { permissoes } from '../lib/perfis'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    request('/api/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, senha) => {
    const funcionario = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    })
    setUser(funcionario)
    return funcionario
  }, [])

  const logout = useCallback(async () => {
    await request('/api/auth/logout', { method: 'POST' }).catch(() => null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout, pode: permissoes(user?.role) }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
