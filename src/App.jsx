import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Login } from './pages/auth/Login'
import { Sidebar } from './layout/Sidebar'
import { AppHeader } from './layout/AppHeader'
import { PageContent } from './layout/main/PageContent'
import { AdminDashboard } from './pages/dashboard/AdminDashboard'
import { AdminSettings } from './pages/settings/AdminSettings'
import { useTranslation } from 'react-i18next';

function App() {
  const { t, i18n } = useTranslation();
  return (
    <Router>
      <div className={`app-layout ${i18n.dir() === 'rtl' ? 'rtl' : ''}`}>
        <Sidebar />
        <div className="main-wrapper">
          <AppHeader />
          <PageContent>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/settings" element={<AdminSettings />} />
              {/* <Route path="/sessions/:id" element={<SessionView />} /> */}
              {/* <Route path="/reports" element={<Reports />} /> */}
              {/* <Route path="/profile/:id" element={<Profile />} /> */}
              <Route path="*" element={<h2>{t('common.pageNotFound')}</h2>} />
            </Routes>
          </PageContent>
        </div>
      </div>
    </Router>
  )
}

export default App
