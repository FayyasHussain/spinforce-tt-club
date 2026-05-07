import { MatchForm } from '../components/MatchForm.jsx';
import { MatchHistoryTable } from '../components/MatchHistoryTable.jsx';

export function MemberMatches({ profile, players, history, loadingAuthData, loadingHistory, onMatchSaved }) {
  return (
    <section className="stack">
      <section className="card">
        <div className="card-header panel-heading">
          <div>
            <h2>Match History</h2>
            <p className="muted">Review your completed matches and results. New submissions appear here after saving.</p>
          </div>
        </div>
        <MatchHistoryTable history={history} loading={loadingHistory} />
      </section>

      <MatchForm
        profile={profile}
        players={players}
        loadingAuthData={loadingAuthData}
        onSaved={onMatchSaved}
      />
    </section>
  );
}
