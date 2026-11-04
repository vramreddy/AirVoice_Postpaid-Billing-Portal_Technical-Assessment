import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, History, Sparkles, ChevronRight, ShieldCheck,
  LogOut, Menu, CalendarDays, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Brand } from './Brand';
import { Loader } from './Common';
import { api } from '../api/client';

const menu = [
  [LayoutDashboard, 'Overview', '/dashboard'],
  [Receipt, 'Billing history', '/bills'],
  [History, 'Payments', '/payments'],
  [Sparkles, 'New Connection', '/subscribe']
];

export function Shell({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (mobileMenu ? 'open' : '')}>
        <div className="sidebar-top">
          <Brand light />
          <button className="close-mobile" onClick={() => setMobileMenu(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-group-label">YOUR WORKSPACE</div>
        <nav className="sidebar-nav">
          {menu.map(([Icon, label, to]) => (
            <NavLink
              to={to}
              key={to}
              end={to === '/dashboard'}
              onClick={() => setMobileMenu(false)}
              className={({ isActive }) => 'nav-link ' + (isActive ? 'active' : '')}
            >
              <Icon size={19} />
              {label}
              <ChevronRight className="nav-chevron" size={15} />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="side-support">
          <span className="support-icon">
            <ShieldCheck size={22} />
          </span>
          <b>Postpaid Protection</b>
          <p>
            Account linked to subscriber ID {user?.accountNumber || 'AV100241'}. 100% itemized transparency.
          </p>
        </div>

        <div className="sidebar-user">
          <span className="avatar">{user?.name?.slice(0, 1) || 'R'}</span>
          <div className="sidebar-user-text">
            <b>{user?.name || 'Ram'}</b>
            <small>{user?.accountNumber || 'AV100241'}</small>
          </div>
          <button
            title="Sign out"
            className="logout-button"
            onClick={() => {
              logout();
              nav('/login');
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="mobile-shade" onClick={() => setMobileMenu(false)} />

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-button" onClick={() => setMobileMenu(true)}>
              <Menu size={22} />
            </button>
            <span>AirVoice Portal</span>
            <ChevronRight size={14} />
            <b>{title}</b>
          </div>
          <div className="topbar-right">
            <span className="badge-pill status-live">
              <span className="status-dot" /> ACTIVE POSTPAID
            </span>
            <div className="top-avatar">{user?.name?.slice(0, 1) || 'R'}</div>
          </div>
        </header>

        <main className="workspace-main">
          <div className="page-heading">
            <div>
              <div className="crumb">AIRVOICE / {title.toUpperCase()}</div>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
            <div className="page-heading-badge">
              <CalendarDays size={17} />
              {new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </div>
          </div>
          {children}
        </main>

        <footer className="public-footer container" style={{ padding: '24px 0' }}>
          <span>AirVoice · Subscriber Self-Service Portal</span>
          <span>Demonstration Environment</span>
        </footer>
      </div>
    </div>
  );
}

export function Protected({ children }) {
  const { token, logout } = useAuth();
  const [ok, setOk] = useState(null);

  useEffect(() => {
    if (!token) {
      setOk(false);
      return;
    }
    api.get('/me')
      .then(() => setOk(true))
      .catch(() => {
        logout();
        setOk(false);
      });
  }, [token]);

  if (!token || ok === false) return <Navigate to="/login" replace />;
  if (ok === null) return <Loader />;
  return children;
}

export default Shell;

