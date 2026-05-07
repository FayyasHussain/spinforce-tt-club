import { LeaderboardTable } from '../components/LeaderboardTable.jsx';

export function ClubRankings({ leaderboard, loadingLeaderboard }) {
  return (
    <section className="card">
      <div className="card-header panel-heading">
        <div>
          <h2>Club Rankings</h2>
          <p className="muted">Rankings are driven by completed matches, so new score submissions automatically update this table.</p>
        </div>
      </div>
      <LeaderboardTable leaderboard={leaderboard} loading={loadingLeaderboard} />
    </section>
  );
}
