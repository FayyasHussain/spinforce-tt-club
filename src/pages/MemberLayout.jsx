import { Outlet } from 'react-router-dom';
import { MemberNav } from '../components/MemberNav.jsx';
import { site } from '../data/siteContent.js';

export function MemberLayout({ session, profile, loadingAuthData, authError, authMessage, onLogout, onRetryProfile }) {
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
              <span>Member Area</span>
            </div>
          </div>
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
        <MemberNav />
        {authError ? <p className="message error">{authError}</p> : null}
        {authMessage ? <p className="message success">{authMessage}</p> : null}
      </header>
      <Outlet />
    </section>
  );
}
