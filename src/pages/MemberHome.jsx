import { Link } from 'react-router-dom';

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
          <p className="muted">Your match record, skill progress, and club activity live here. Pick the next action and jump straight in.</p>
        </div>
      </section>

      <section className="dashboard-stat-grid">
        <article className="card panel dashboard-stat-card">
          <span>Current Rank</span>
          <strong>{currentRank ? `#${currentRank}` : '-'}</strong>
          <p>{ownRanking?.points ?? 0} points</p>
        </article>
        <article className="card panel dashboard-stat-card">
          <span>Matches</span>
          <strong>{ownRanking?.total_matches ?? history.length}</strong>
          <p>{ownRanking?.wins ?? 0} wins · {ownRanking?.losses ?? 0} losses</p>
        </article>
        <article className="card panel dashboard-stat-card">
          <span>Skills Started</span>
          <strong>{startedSkills}</strong>
          <p>{skills.length} total ladder skills</p>
        </article>
        <article className="card panel dashboard-stat-card">
          <span>Match Ready Skills</span>
          <strong>{matchReadySkills}</strong>
          <p>Level 3 or higher</p>
        </article>
      </section>

      <section className="dashboard-action-grid">
        <DashboardAction
          title="Profile"
          description="View your member details. Photos, edit options, and playing preferences can come here later."
          to="/member/profile"
        />
        <DashboardAction
          title="Matches"
          description="Submit a match score or review your match history."
          to="/member/matches"
        />
        <DashboardAction
          title="Skill Ladder"
          description="Update progress category by category and keep training notes attached to each skill."
          to="/member/skills"
        />
        <DashboardAction
          title="Club Rankings"
          description="Check the current leaderboard and see how match results affect points."
          to="/member/rankings"
        />
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

function DashboardAction({ title, description, to }) {
  return (
    <Link className="card panel dashboard-action-card" to={to}>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <span>Open</span>
    </Link>
  );
}
