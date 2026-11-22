import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

// roles: perfis permitidos na rota (vazio = qualquer usuário logado).
export function ProtectedRoute({ children, roles }) {
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <main className="center-screen">
        <div className="loader" aria-label="Carregando" />
      </main>
    )
  }

  if (!user) return <Navigate to="/" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />

  return children
}
