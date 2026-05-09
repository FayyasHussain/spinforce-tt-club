import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MemberNav } from '../components/MemberNav.jsx';
import { site } from '../data/siteContent.js';

export function MemberLayout({ session, profile, loadingAuthData, authError, authMessage, onLogout, onRetryProfile }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const profileLabel = loadingAuthData
    ? 'Loading...'
    : profile?.name || 'No linked profile found';

  return (
    <section className="member-shell">
      <header className="member-topbar card">
        <div className="member-topbar-main">
          <div className="member-brand">
            <img className="member-brand-logo" src={site.logo} alt="Spin Force logo" />
            <div>
              <strong>Spin Force</strong>
              <span>{profile?.name || 'Member Area'}</span>
            </div>
          </div>
          <button
            className={`member-menu-button ${isMenuOpen ? 'open' : ''}`}
            type="button"
            aria-label={isMenuOpen ? 'Close member menu' : 'Open member menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="member-account-strip">
            <div>
              <span>{session?.user?.email ?? ''}</span>
              <strong>{profileLabel}</strong>
            </div>
            {!profile && !loadingAuthData ? (
              <button className="button button-small" type="button" onClick={onRetryProfile}>Retry Profile</button>
            ) : null}
            <button className="button button-secondary button-small" type="button" onClick={onLogout}>Log out</button>
          </div>
        </div>
        <div className={`member-menu-panel ${isMenuOpen ? 'open' : ''}`}>
          <div className="member-menu-account">
            <span>{session?.user?.email ?? ''}</span>
            <strong>{profileLabel}</strong>
          </div>
          <MemberNav onNavigate={() => setIsMenuOpen(false)} />
          <div className="member-menu-actions">
            {!profile && !loadingAuthData ? (
              <button className="button button-small" type="button" onClick={onRetryProfile}>Retry Profile</button>
            ) : null}
            <button className="button button-secondary button-small" type="button" onClick={onLogout}>Log out</button>
          </div>
        </div>
        {authError ? <p className="message error">{authError}</p> : null}
        {authMessage ? <p className="message success">{authMessage}</p> : null}
      </header>
      <Outlet />
    </section>
  );
}
