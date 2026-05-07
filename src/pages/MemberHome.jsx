import { LeaderboardTable } from '../components/LeaderboardTable.jsx';

export function MemberHome({ leaderboard, loadingLeaderboard }) {
  return (
    <section className="card">
      <div className="card-header panel-heading">
        <div>
          <h2>Rankings</h2>
          <p className="muted">This stays driven by the derived <code>player_rankings</code> view, so match inserts automatically affect this page.</p>
        </div>
      </div>
      <LeaderboardTable leaderboard={leaderboard} loading={loadingLeaderboard} />
    </section>
  );
}
