import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import AuthCallback from '@/pages/AuthCallback'
import Dashboard from '@/pages/Dashboard'
import Transactions from '@/pages/Transactions'
import Budgets from '@/pages/Budgets'
import Investments from '@/pages/Investments'
import QRIS from '@/pages/QRIS'
import Account from '@/pages/Account'
import AdminCompliance from '@/pages/AdminCompliance'
import AppShell from '@/layout/AppShell'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { useAuth } from '@/auth/useAuth'

function IndexRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IndexRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/qris" element={<QRIS />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin/compliance" element={<AdminCompliance />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
