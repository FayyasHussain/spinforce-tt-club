export function AccountCard({ session, profile, loadingAuthData, authError, authMessage, onLogout, onRetryProfile }) {
  const profileLabel = loadingAuthData
    ? 'Loading...'
    : profile?.name || 'No linked profile found';

  return (
    <section className="card panel">
      <div className="card-header">
        <div>
          <h2>Account</h2>
          <p className="muted">Supabase Auth identifies the user. The app then looks up the linked row in <code>profiles</code>.</p>
        </div>
      </div>
      <dl className="details">
        <div>
          <dt>Email</dt>
          <dd>{session?.user?.email ?? ''}</dd>
        </div>
        <div>
          <dt>Player Profile</dt>
          <dd>{profileLabel}</dd>
        </div>
      </dl>
      {authError ? <p className="message error">{authError}</p> : null}
      {authMessage ? <p className="message success">{authMessage}</p> : null}
      <div className="hero-actions">
        {!profile && !loadingAuthData ? (
          <button className="button" type="button" onClick={onRetryProfile}>Retry Profile</button>
        ) : null}
        <button className="button button-secondary" type="button" onClick={onLogout}>Log out</button>
      </div>
    </section>
  );
}
