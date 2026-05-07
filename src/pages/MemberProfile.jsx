import { MatchHistoryTable } from '../components/MatchHistoryTable.jsx';

export function MemberProfile({ profile, history, loadingAuthData, loadingHistory }) {
  if (loadingAuthData) {
    return (
      <section className="card panel">
        <div className="card-header">
          <div>
            <h2>Profile</h2>
            <p className="muted">Loading your player record.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="card panel">
        <div className="card-header">
          <div>
            <h2>Profile</h2>
            <p className="muted">No linked player profile was found for this account.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="stack">
      <section className="card panel">
        <div className="card-header">
          <div>
            <h2>Profile</h2>
            <p className="muted">These fields come from your row in <code>public.profiles</code>.</p>
          </div>
        </div>
        <dl className="details">
          <div>
            <dt>Name</dt>
            <dd>{profile.name}</dd>
          </div>
          <div>
            <dt>Mobile</dt>
            <dd>{profile.mobile ?? ''}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{profile.address ?? ''}</dd>
          </div>
          <div>
            <dt>Skill Level</dt>
            <dd>{profile.skill_level ?? ''}</dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <div className="card-header panel-heading">
          <div>
            <h2>Match History</h2>
            <p className="muted">This queries only the logged-in player's matches, ordered by newest first.</p>
          </div>
        </div>
        <MatchHistoryTable history={history} loading={loadingHistory} />
      </section>
    </section>
  );
}
