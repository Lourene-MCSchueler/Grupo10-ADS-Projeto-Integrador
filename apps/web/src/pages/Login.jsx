import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const loginHighlights = [
  { value: '3', label: 'perfis de acesso' },
  { value: '2min', label: 'para avisar pacientes' },
  { value: '.xlsx', label: 'exportação auditada' },
]

// Atalhos para a apresentação da PoC (só aparecem em `npm run dev`).
const contasTeste = [
  { email: 'ana@clinica.com', label: 'Médica' },
  { email: 'recepcao@clinica.com', label: 'Recepção' },
  { email: 'gestor@clinica.com', label: 'Gestor' },
]

export function Login() {
  const { login, user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Após o login, `submitting` ainda é true: o painel mostra "Usuário autenticado".
  if (!loading && user) {
    return <Navigate replace state={submitting ? { autenticado: true } : undefined} to="/dashboard" />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !senha.trim()) {
      setError('Informe e-mail e senha para continuar.')
      return
    }

    setSubmitting(true)
    try {
      await login(email.trim(), senha)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  function preencher(conta) {
    setEmail(conta.email)
    setSenha('123456')
    setError('')
  }

  return (
    <main className="login-page">
      <section className="login-hero" aria-label="Resumo da solução">
        <div className="login-copy">
          <span className="eyebrow">PoC Grupo 31</span>
          <h1>
            MediControl<wbr />
            Register
          </h1>
          <p>Bem-vindo ao seu aplicativo de Registros de Ausências Médicas.</p>
          <p>
            Registre a ausência, encontre os pacientes afetados e avise todos pelo WhatsApp, sem
            ligar um por um.
          </p>
          <div className="benefit-row" aria-label="Benefícios do sistema">
            <span>Agenda por dia e horário</span>
            <span>Pacientes identificados</span>
            <span>Aviso automático</span>
            <span>Relatório para o gestor</span>
          </div>
        </div>

        <div className="login-preview" aria-hidden="true">
          <div className="preview-topbar">
            <span />
            <strong>Agenda · manhã</strong>
            <small>07:00-12:00</small>
          </div>
          <div className="preview-row">
            <span>08:00</span>
            <div>
              <strong>João Silva</strong>
              <small>Aguardando atendimento</small>
            </div>
          </div>
          <div className="preview-row active">
            <span>09:30</span>
            <div>
              <strong>Maria Souza</strong>
              <small>Paciente será avisada</small>
            </div>
          </div>
          <div className="preview-action">Registrar ausência</div>
        </div>

        <div className="login-stats">
          {loginHighlights.map((item) => (
            <div key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <form className="login-panel" onSubmit={handleSubmit}>
        <div>
          <span className="eyebrow">Acesso da clínica</span>
          <h2>Entrar no sistema</h2>
          <p>Médicos, recepção e gestão usam o login cadastrado pela clínica.</p>
        </div>

        <label>
          E-mail
          <input
            autoComplete="email"
            disabled={submitting}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nome@clinica.com"
            type="email"
            value={email}
          />
        </label>

        <label>
          Senha
          <input
            autoComplete="current-password"
            disabled={submitting}
            onChange={(event) => setSenha(event.target.value)}
            placeholder="Digite sua senha"
            type="password"
            value={senha}
          />
        </label>

        {error && <p className="alert error">{error}</p>}

        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>

        {import.meta.env.DEV && (
          <div className="test-accounts">
            <span className="muted">Contas de teste (senha 123456)</span>
            <div className="chip-row">
              {contasTeste.map((conta) => (
                <button className="chip" key={conta.email} onClick={() => preencher(conta)} type="button">
                  {conta.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </main>
  )
}
