import { Outlet, useLocation } from 'react-router-dom';
import { AccountCard } from '../components/AccountCard.jsx';
import { MatchForm } from '../components/MatchForm.jsx';
import { MemberNav } from '../components/MemberNav.jsx';

export function MemberLayout({ session, profile, players, loadingAuthData, authError, authMessage, onLogout, onMatchSaved }) {
  const location = useLocation();
  const isHome = location.pathname === '/member';

  return (
    <section className="layout">
      <div className="stack">
        <AccountCard
          session={session}
          profile={profile}
          authError={authError}
          authMessage={authMessage}
          onLogout={onLogout}
        />
        <MemberNav />
        {isHome ? (
          <MatchForm
            profile={profile}
            players={players}
            loadingAuthData={loadingAuthData}
            onSaved={onMatchSaved}
          />
        ) : null}
      </div>
      <Outlet />
    </section>
  );
}
