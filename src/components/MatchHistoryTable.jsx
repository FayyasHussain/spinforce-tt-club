import { formatDate } from '../utils/date.js';

export function MatchHistoryTable({ history, loading }) {
  if (loading) {
    return (
      <table>
        <tbody>
          <tr>
            <td colSpan="4">Loading match history...</td>
          </tr>
        </tbody>
      </table>
    );
  }

  if (!history.length) {
    return (
      <table>
        <tbody>
          <tr>
            <td colSpan="4">No matches found for this player.</td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Opponent</th>
          <th>Status</th>
          <th>Score</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {history.map((match) => (
          <tr key={match.id}>
            <td>
              <div className="opponent-cell">
                <strong>{match.opponentName}</strong>
                {match.opponentRank ? (
                  <span className="rank-pill">Current Rank #{match.opponentRank}</span>
                ) : (
                  <span className="rank-pill rank-pill-muted">Rank unavailable</span>
                )}
              </div>
            </td>
            <td><span className={`status-pill ${match.result.toLowerCase()}`}>{match.result}</span></td>
            <td>
              <div className="score-cell">
                <strong>{match.score}</strong>
                <span>{match.formatSummary}</span>
                <span>{match.setSummary}</span>
              </div>
            </td>
            <td>{formatDate(match.matchDate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
