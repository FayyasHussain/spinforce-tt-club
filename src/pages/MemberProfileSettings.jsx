import { useState } from 'react';
import { Link } from 'react-router-dom';
import { site } from '../data/siteContent.js';
import { supabase } from '../lib/supabase.js';

export function MemberProfileSettings({ profile, loadingAuthData, onRetryProfile }) {
  const [activePanel, setActivePanel] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handlePasswordChange = (field, value) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
    setPasswordMessage('');
    setPasswordError('');
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!supabase) {
      setPasswordError('Supabase is not configured for this environment.');
      setPasswordMessage('');
      return;
    }

    if (passwordForm.password.length < 8) {
      setPasswordError('Use at least 8 characters for the new password.');
      setPasswordMessage('');
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setPasswordError('The password confirmation does not match.');
      setPasswordMessage('');
      return;
    }

    setSavingPassword(true);
    setPasswordError('');
    setPasswordMessage('Updating password...');

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.password,
    });

    setSavingPassword(false);

    if (error) {
      setPasswordError(error.message);
      setPasswordMessage('');
      return;
    }

    setPasswordForm({ password: '', confirmPassword: '' });
    setPasswordMessage('Password updated successfully.');
  };

  if (loadingAuthData) {
    return (
      <section className="card panel">
        <div className="card-header">
          <div>
            <h2>Profile Settings</h2>
            <p className="muted">Loading your player record.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="card panel">
        <div className="card-header">
          <div>
            <h2>Profile Settings</h2>
            <p className="muted">No linked player profile was found for this account.</p>
          </div>
        </div>
        <button className="button" type="button" onClick={onRetryProfile}>Retry Profile Lookup</button>
      </section>
    );
  }

  return (
    <section className="stack">
      <section className="card panel settings-hero">
        <div>
          <p className="eyebrow dark">Account</p>
          <h2>Profile Settings</h2>
          <p className="muted">Manage login access and account requests for {profile.name}.</p>
        </div>
        <Link className="button button-secondary button-small" to="/member/profile">Back To Profile</Link>
      </section>

      <section className="settings-grid">
        <article className={`card panel settings-option ${activePanel === 'password' ? 'active' : ''}`}>
          <span className="settings-icon">P</span>
          <div>
            <h3>Change Password</h3>
            <p className="muted">Update the password used to sign in to your member account.</p>
          </div>
          <button className="button button-small" type="button" onClick={() => setActivePanel('password')}>
            Change Password
          </button>
        </article>

        <article className="card panel settings-option">
          <span className="settings-icon">A</span>
          <div>
            <h3>Ask Admin To Delete Account</h3>
            <p className="muted">For now this sends a WhatsApp request to club support so an admin can make the account inactive.</p>
          </div>
          <a className="button button-secondary button-small" href={site.whatsappUrl} target="_blank" rel="noreferrer">
            Contact Admin
          </a>
        </article>
      </section>

      {activePanel === 'password' ? (
        <section className="card panel settings-detail">
          <div className="card-header">
            <div>
              <h2>Change Password</h2>
              <p className="muted">Choose a new password with at least 8 characters.</p>
            </div>
          </div>
          <form className="form account-settings-form" onSubmit={handlePasswordSubmit}>
            <div className="field-grid">
              <label className="field">
                <span>New Password</span>
                <input
                  type="password"
                  value={passwordForm.password}
                  onChange={(event) => handlePasswordChange('password', event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <label className="field">
                <span>Confirm Password</span>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => handlePasswordChange('confirmPassword', event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
            </div>
            {passwordError ? <p className="message error">{passwordError}</p> : null}
            {passwordMessage ? <p className="message success">{passwordMessage}</p> : null}
            <button className="button" type="submit" disabled={savingPassword}>
              {savingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </section>
      ) : null}
    </section>
  );
}
