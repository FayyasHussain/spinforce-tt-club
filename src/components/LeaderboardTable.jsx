export function LeaderboardTable({ leaderboard, loading }) {
  if (loading) {
    return (
      <table>
        <tbody>
          <tr>
            <td colSpan="7">Loading leaderboard...</td>
          </tr>
        </tbody>
      </table>
    );
  }

  if (!leaderboard.length) {
    return (
      <table>
        <tbody>
          <tr>
            <td colSpan="7">No ranking data found.</td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th>Skill Level</th>
          <th>Matches</th>
          <th>Wins</th>
          <th>Losses</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        {leaderboard.map((player, index) => (
          <tr key={player.id}>
            <td>{index + 1}</td>
            <td>{player.name}</td>
            <td>{player.skill_level ?? ''}</td>
            <td>{player.total_matches ?? 0}</td>
            <td>{player.wins ?? 0}</td>
            <td>{player.losses ?? 0}</td>
            <td><strong>{player.points ?? 0}</strong></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
