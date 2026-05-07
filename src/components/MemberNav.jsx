import { NavLink } from 'react-router-dom';

export function MemberNav() {
  return (
    <nav className="member-top-nav" aria-label="Member navigation">
      <NavLink className={({ isActive }) => `member-top-link ${isActive ? 'active' : ''}`} to="/member" end>Dashboard</NavLink>
      <NavLink className={({ isActive }) => `member-top-link ${isActive ? 'active' : ''}`} to="/member/profile">Profile</NavLink>
      <NavLink className={({ isActive }) => `member-top-link ${isActive ? 'active' : ''}`} to="/member/matches">Matches</NavLink>
      <NavLink className={({ isActive }) => `member-top-link ${isActive ? 'active' : ''}`} to="/member/skills">Skill Ladder</NavLink>
      <NavLink className={({ isActive }) => `member-top-link ${isActive ? 'active' : ''}`} to="/member/rankings">Club Rankings</NavLink>
      <NavLink className="member-top-link" to="/">Public Homepage</NavLink>
    </nav>
  );
}
