import { NavLink } from 'react-router-dom';

export function MemberNav({ isAdmin, isCoach, onNavigate }) {
  return (
    <nav className="member-top-nav" aria-label="Member navigation">
      <NavLink className={({ isActive }) => `member-top-link ${isActive ? 'active' : ''}`} to="/member" end onClick={onNavigate}>Dashboard</NavLink>
      <NavLink className={({ isActive }) => `member-top-link ${isActive ? 'active' : ''}`} to="/member/profile" onClick={onNavigate}>Profile</NavLink>
      <NavLink className={({ isActive }) => `member-top-link ${isActive ? 'active' : ''}`} to="/member/matches" onClick={onNavigate}>Matches</NavLink>
      <NavLink className={({ isActive }) => `member-top-link ${isActive ? 'active' : ''}`} to="/member/skills" onClick={onNavigate}>Skill Ladder</NavLink>
      <NavLink className={({ isActive }) => `member-top-link ${isActive ? 'active' : ''}`} to="/member/rankings" onClick={onNavigate}>Club Rankings</NavLink>
      {isAdmin ? (
        <NavLink className={({ isActive }) => `member-top-link ${isActive ? 'active' : ''}`} to="/member/admin" onClick={onNavigate}>Admin</NavLink>
      ) : null}
      {isCoach ? (
        <NavLink className={({ isActive }) => `member-top-link ${isActive ? 'active' : ''}`} to="/member/coaching" onClick={onNavigate}>Coaching</NavLink>
      ) : null}
      <NavLink className="member-top-link" to="/" onClick={onNavigate}>Public Homepage</NavLink>
    </nav>
  );
}
