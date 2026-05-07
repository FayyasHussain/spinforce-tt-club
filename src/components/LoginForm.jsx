export function LoginForm({ authError, authMessage, onLogin }) {
  return (
    <div className="header-login-panel">
      <form className="header-login-form" onSubmit={onLogin}>
        <label className="field compact-field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label className="field compact-field">
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="button" type="submit">Sign in</button>
      </form>
      {authError ? <p className="message error">{authError}</p> : null}
      {authMessage ? <p className="message success">{authMessage}</p> : null}
    </div>
  );
}
