import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Login } from './pages/auth/Login'
import { Sidebar } from './layout/Sidebar'
import { AppHeader } from './layout/AppHeader'
import { PageContent } from './layout/main/PageContent'
import { AdminDashboard } from './pages/dashboard/AdminDashboard'
import { AdminSettings } from './pages/settings/AdminSettings'
import { UploadPage } from './pages/upload/UploadPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminRoute } from './components/auth/AdminRoute'
import { selectIsAuthenticated } from './store/authSlice'
import { useAppSocket } from './hooks/useAppSocket'
import { useTranslation } from 'react-i18next';
import { SessionsPage } from './pages/sessions/SessionsPage'
import { AdviserReportPage } from './pages/reports/AdviserReportPage'
import { ClientReportPage } from './pages/reports/ClientReportPage'
import { SummaryReportPage } from './pages/reports/SummaryReportPage'

function App() {
  const { t, i18n } = useTranslation();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Initialize app-level socket connection
  const { socketConnected } = useAppSocket();

  return (
    <Router>
      <div className={`app-layout ${i18n.dir() === 'rtl' ? 'rtl' : ''}`}>
        {/* Only show sidebar when user is authenticated */}
        {isAuthenticated && <Sidebar />}

        <div className={`main-wrapper ${!isAuthenticated ? 'full-width' : ''}`}>
          {/* Only show header when user is authenticated */}
          {<AppHeader />}

          <PageContent>
            <Routes>
              {/* Public route - Login */}
              <Route path="/" element={<Login />} />

              {/* Admin-only routes */}
              <Route
                path="/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <AdminRoute>
                    <AdminSettings />
                  </AdminRoute>
                }
              />

              {/* Protected routes (any authenticated user) */}
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <UploadPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/sessions"
                element={
                  <ProtectedRoute>
                    <SessionsPage />
                  </ProtectedRoute>
                }
              />

              {/* Report routes */}
              <Route
                path="/reports/adviser/:sessionId"
                element={
                  <ProtectedRoute>
                    <AdviserReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/client/:sessionId"
                element={
                  <ProtectedRoute>
                    <ClientReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/summary/:sessionId"
                element={
                  <ProtectedRoute>
                    <SummaryReportPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch all - redirect to appropriate page */}
              <Route path="*" element={<h2>{t('common.pageNotFound')}</h2>} />
            </Routes>
          </PageContent>
        </div>
      </div>
    </Router>
  )
}

export default App
