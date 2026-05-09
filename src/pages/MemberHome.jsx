export function MemberHome({ profile, leaderboard, history, skills, skillProgress }) {
  const rankIndex = profile ? leaderboard.findIndex((player) => player.id === profile.id) : -1;
  const currentRank = rankIndex >= 0 ? rankIndex + 1 : null;
  const ownRanking = profile ? leaderboard.find((player) => player.id === profile.id) : null;
  const startedSkills = skillProgress.filter((item) => Number(item.current_level) > 0).length;
  const matchReadySkills = skillProgress.filter((item) => Number(item.current_level) >= 3).length;
  const latestMatch = history[0];

  return (
    <section className="stack">
      <section className="card panel dashboard-hero">
        <div>
          <p className="eyebrow dark">Member Dashboard</p>
          <h2>Welcome back{profile?.name ? `, ${profile.name}` : ''}</h2>
          <p className="muted dashboard-lead-full">Your match record, skill progress, and club activity live here. Pick the next action and jump straight in.</p>
          <p className="muted dashboard-lead-mobile">Your match, skill, and ranking snapshot.</p>
        </div>
      </section>

      <section className="dashboard-stat-grid">
        <article className="card panel dashboard-stat-card">
          <span className="dashboard-icon" aria-hidden="true">#</span>
          <div>
            <span>Current Rank</span>
            <strong>{currentRank ? `#${currentRank}` : '-'}</strong>
            <p>{ownRanking?.points ?? 0} points</p>
          </div>
        </article>
        <article className="card panel dashboard-stat-card">
          <span className="dashboard-icon" aria-hidden="true">M</span>
          <div>
            <span>Matches</span>
            <strong>{ownRanking?.total_matches ?? history.length}</strong>
            <p>{ownRanking?.wins ?? 0} wins · {ownRanking?.losses ?? 0} losses</p>
          </div>
        </article>
        <article className="card panel dashboard-stat-card">
          <span className="dashboard-icon" aria-hidden="true">S</span>
          <div>
            <span>Skills Started</span>
            <strong>{startedSkills}</strong>
            <p>{skills.length} total ladder skills</p>
          </div>
        </article>
        <article className="card panel dashboard-stat-card">
          <span className="dashboard-icon" aria-hidden="true">R</span>
          <div>
            <span>Match Ready</span>
            <strong>{matchReadySkills}</strong>
            <p>Level 3+</p>
          </div>
        </article>
      </section>

      <section className="dashboard-two-column">
        <section className="card panel">
          <div className="card-header">
            <div>
              <h2>Recent Match</h2>
              <p className="muted">Your latest saved result.</p>
            </div>
          </div>
          {latestMatch ? (
            <div className="dashboard-detail">
              <strong>{latestMatch.result} vs {latestMatch.opponentName}</strong>
              <span>{latestMatch.score} · {latestMatch.setSummary || 'Set details unavailable'}</span>
            </div>
          ) : (
            <p className="message">No match history yet.</p>
          )}
        </section>

        <section className="card panel">
          <div className="card-header">
            <div>
              <h2>Next Useful Step</h2>
              <p className="muted">A simple nudge based on where the profile currently has data.</p>
            </div>
          </div>
          {startedSkills ? (
            <p className="message">Open the Skill Ladder and move one practice-ready skill toward match-ready.</p>
          ) : (
            <p className="message">Start with the Skill Ladder and mark the skills you are already learning.</p>
          )}
        </section>
      </section>
    </section>
  );
}
