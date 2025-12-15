import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Camera, LogOut, User, Upload, Settings, BarChart3, Users } from 'lucide-react';
import logoT from '../../src/assets/logo-t.png';
import { useTranslation } from 'react-i18next';
import { logout, selectUser, selectIsAdmin } from '../store/authSlice';

export function Sidebar () {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const isAdmin = useSelector(selectIsAdmin);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    return (
        <aside className={`sidebar`}>
        {/* <aside className={`sidebar ${i18n.dir() === 'rtl' ? 'rtl' : ''}`}> */}
          <div className="sidebar-logo">
            <img src={logoT} alt="Logo" />
            <h2>{t('common.appName')} 
              <br />
              {t('common.appName2')}
            </h2>
          </div>
          <nav>
              {isAdmin ? (
                // Admin navigation - can access everything
                <>
                  <NavLink to="/dashboard">
                    <BarChart3 />
                    {t('common.dashboard')}
                  </NavLink>
                  <NavLink to="/settings">
                    <Settings />
                    {t('common.settings')}
                  </NavLink>
                  <NavLink to="/upload">
                    <Upload />
                    {t('sidebar.upload')}
                  </NavLink>
                  <NavLink to="/sessions">
                    <Users />
                    {t('sidebar.sessions')}
                  </NavLink>
                </>
              ) : (
                // Adviser navigation
                <>
                  <NavLink to="/upload">
                    <Upload />
                    {t('sidebar.upload')}
                  </NavLink>
                  <NavLink to="/sessions">
                    <Users />
                    {t('sidebar.sessions')}
                  </NavLink>
                </>
              )}
          </nav>
          <section className='user-info'>
            <div className='user-details'>
              <User />
              <p>{user?.name || user?.email}</p>
              <p>{user?.role}</p>
            </div>
            <div className='user-info-logout'>
              <button onClick={handleLogout}>
                <LogOut />
                {t('common.logout')}
              </button>
            </div>
          </section>
        </aside>
      )
}