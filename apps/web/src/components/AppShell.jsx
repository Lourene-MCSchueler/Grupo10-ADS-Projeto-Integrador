import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { PERFIS } from '../lib/perfis'

const NOTAS = {
  medico: 'Registre sua ausência e o sistema avisa os pacientes afetados pelo WhatsApp.',
  recepcao: 'Consulte a agenda de qualquer médico e registre ausências em nome dele.',
  gestor: 'Acompanhe as ausências do mês, os avisos enviados e as falhas de envio.',
}

// Layout das rotas logadas (o ProtectedRoute garante que há usuário).
export function AppShell() {
  const { user, logout, pode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const links = [
    { to: '/dashboard', label: 'Painel', icon: 'P' },
    { to: '/agenda', label: 'Agenda', icon: 'A' },
    { to: '/ausencia', label: 'Registrar ausência', icon: '!' },
    ...(pode.verResumo ? [{ to: '/relatorio', label: 'Relatório de ausências', icon: 'R' }] : []),
  ]

  const perfil = PERFIS[user.role]

  return (
    <div className="app-frame">
      <aside className="sidebar" aria-label="Navegação principal">
        <Link className="brand" to="/dashboard">
          <span className="brand-mark">MC</span>
          <span>
            <strong>MediControlRegister</strong>
            <small>Registro de ausências médicas</small>
          </span>
        </Link>

        <nav className="nav-list">
          {links.map((item) => (
            <Link
              aria-current={location.pathname === item.to ? 'page' : undefined}
              className={location.pathname === item.to ? 'nav-item active' : 'nav-item'}
              key={item.to}
              to={item.to}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-note">
          <strong>Perfil {perfil?.label}</strong>
          <p>{NOTAS[user.role]}</p>
        </div>

        <div className="doctor-card">
          <span className="avatar">{user.nome?.slice(0, 1) || '?'}</span>
          <div>
            <strong>{user.nome}</strong>
            <small>{user.crm || perfil?.label || 'Sessão ativa'}</small>
          </div>
        </div>

        <button className="ghost-button" type="button" onClick={handleLogout}>
          Sair
        </button>
      </aside>

      <div className="workspace">
        <Outlet />
      </div>
    </div>
  )
}
