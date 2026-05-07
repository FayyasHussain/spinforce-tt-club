import { Link } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm.jsx';

export function MemberGate({ showLogin, authError, authMessage, onToggleLogin, onLogin }) {
  return (
    <section className="member-gate card panel">
      <div className="card-header">
        <div>
          <p className="eyebrow dark">Members</p>
          <h2>Member Login Required</h2>
          <p className="muted">This area is available only to signed-in members. Log in to access rankings tools, your profile, and match submission.</p>
        </div>
      </div>
      <div className="hero-actions">
        <button className="button" type="button" onClick={onToggleLogin}>Open Login</button>
        <Link className="button button-secondary" to="/">Back To Homepage</Link>
      </div>
      {showLogin ? <LoginForm authError={authError} authMessage={authMessage} onLogin={onLogin} /> : null}
    </section>
  );
}
