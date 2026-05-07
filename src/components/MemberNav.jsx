import { NavLink } from 'react-router-dom';

export function MemberNav() {
  return (
    <section className="card panel">
      <div className="card-header">
        <div>
          <h2>Views</h2>
          <p className="muted">Track matches, review your player record, and update your table tennis skill ladder.</p>
        </div>
      </div>
      <div className="nav-list">
        <NavLink className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`} to="/member" end>Home</NavLink>
        <NavLink className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`} to="/member/profile">Profile</NavLink>
        <NavLink className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`} to="/member/skills">Skill Ladder</NavLink>
        <NavLink className="nav-button" to="/">Public Homepage</NavLink>
      </div>
    </section>
  );
}
