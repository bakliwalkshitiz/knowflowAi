import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'
import { ProtectedRoute, PublicRoute } from '../components/layout/RouteGuards'
import AppLayout from '../components/layout/AppLayout'
import LoginPage from '../pages/auth/LoginPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import ChatPage from '../pages/chat/ChatPage'
import DocumentsPage from '../pages/documents/DocumentsPage'
import HistoryPage from '../pages/history/HistoryPage'
import SettingsPage from '../pages/settings/SettingsPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

            {/* Protected */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/chat"      element={<ChatPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/history"   element={<HistoryPage />} />
              <Route path="/settings"  element={<SettingsPage />} />
            </Route>

            {/* Default */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
