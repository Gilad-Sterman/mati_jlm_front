import React from 'react'
import { NavLink } from 'react-router-dom'
import { Camera, LogOut, User } from 'lucide-react';
import logo from '../../public/logo.svg'
import { useTranslation } from 'react-i18next';

export function Sidebar () {
    const { t, i18n } = useTranslation();

    return (
        <aside className={`sidebar ${i18n.dir() === 'rtl' ? 'rtl' : ''}`}>
          <div className="sidebar-logo">
            <img src={logo} alt="Logo" />
          </div>
          <nav>
              <NavLink to="/dashboard">{t('common.dashboard')}</NavLink>
              <NavLink to="/sessions/1">{t('common.session')}</NavLink>
              <NavLink to="/reports">{t('common.reports')}</NavLink>
              <NavLink to="/settings">{t('common.settings')}</NavLink>
          </nav>
          <section className='user-info'>
            <div className='user-details'>
              <User />
              <p>{t('common.user.name')},</p>
              <p>{t('common.user.role')}</p>
            </div>
            <div className='user-info-logout'>
              <button>
                <LogOut />
                {t('common.logout')}
              </button>
            </div>
          </section>
        </aside>
      )
}