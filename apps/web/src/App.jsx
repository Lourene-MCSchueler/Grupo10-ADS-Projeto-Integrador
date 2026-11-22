import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppShell } from './components/AppShell'
import { Agenda } from './pages/Agenda'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { RegistrarAusencia } from './pages/RegistrarAusencia'
import { RelatorioAusencias } from './pages/RelatorioAusencias'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/ausencia" element={<RegistrarAusencia />} />
          <Route
            path="/relatorio"
            element={
              <ProtectedRoute roles={['gestor']}>
                <RelatorioAusencias />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
