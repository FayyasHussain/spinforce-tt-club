import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MatchHistoryTable } from '../components/MatchHistoryTable.jsx';
import { updateMemberProfile } from '../services/profiles.js';

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) {
    return '';
  }

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return '';
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 0 ? `${age} years` : '';
}

function formatDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function initialsForName(name) {
  return (name || 'Member')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'M';
}

function emergencyContactValue(profile) {
  if (profile.emergency_contact_name && profile.emergency_contact) {
    return `${profile.emergency_contact_name} | ${profile.emergency_contact}`;
  }

  return profile.emergency_contact_name || profile.emergency_contact || '';
}

export function MemberProfile({ profile, history, loadingAuthData, loadingHistory, onRetryProfile, onProfileUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    address: '',
    dateOfBirth: '',
    emergencyContactName: '',
    emergencyContact: '',
    profilePhotoFile: null,
  });
  const [editMessage, setEditMessage] = useState('');
  const [editError, setEditError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = () => {
    setEditForm({
      address: profile.address ?? '',
      dateOfBirth: profile.date_of_birth ?? '',
      emergencyContactName: profile.emergency_contact_name ?? '',
      emergencyContact: profile.emergency_contact ?? '',
      profilePhotoFile: null,
    });
    setEditMessage('');
    setEditError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditMessage('');
    setEditError('');
  };

  const handleEditChange = (field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }));
    setEditMessage('');
    setEditError('');
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setEditMessage('Saving profile...');
    setEditError('');

    try {
      await updateMemberProfile({
        profileId: profile.id,
        address: editForm.address.trim(),
        dateOfBirth: editForm.dateOfBirth,
        emergencyContactName: editForm.emergencyContactName.trim(),
        emergencyContact: editForm.emergencyContact.trim(),
        profilePhotoFile: editForm.profilePhotoFile,
      });
      setEditMessage('Profile updated successfully.');
      setIsEditing(false);
      await onProfileUpdated();
    } catch (error) {
      setEditError(error.message);
      setEditMessage('');
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingAuthData) {
    return (
      <section className="card panel">
        <div className="card-header">
          <div>
            <h2>Profile</h2>
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
            <h2>Profile</h2>
            <p className="muted">No linked player profile was found for this account.</p>
          </div>
        </div>
        <button className="button" type="button" onClick={onRetryProfile}>Retry Profile Lookup</button>
      </section>
    );
  }

  const profileDetails = [
    { label: 'Mobile', value: profile.mobile },
    { label: 'Location', value: profile.address },
    { label: 'Skill Level', value: profile.skill_level },
    { label: 'Date Of Birth', value: formatDate(profile.date_of_birth) },
    { label: 'Age', value: calculateAge(profile.date_of_birth) },
    { label: 'Emergency Contact', value: emergencyContactValue(profile) },
    { label: 'Parent / Guardian', value: profile.parent_guardian_name },
  ].filter((item) => item.value);

  return (
    <section className="stack">
      <section className="card panel">
        <div className="profile-summary">
          <div className="profile-photo-frame">
            {profile.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt={`${profile.name} profile`} />
            ) : (
              <span>{initialsForName(profile.name)}</span>
            )}
          </div>
          <div className="profile-summary-copy">
            <p className="eyebrow dark">Member Profile</p>
            <h2>{profile.name}</h2>
            <p className="muted">Your club profile details and match history live here.</p>
            <div className="profile-actions">
              <button className="button button-small" type="button" onClick={startEditing}>Edit Profile</button>
              <Link className="button button-small" to="/member/profile/settings">Profile Settings</Link>
            </div>
          </div>
        </div>

        <dl className="profile-detail-grid">
          {profileDetails.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
        {editMessage ? <p className="message success">{editMessage}</p> : null}
        {editError ? <p className="message error">{editError}</p> : null}
        {isEditing ? (
          <form className="profile-edit-form" onSubmit={handleEditSubmit}>
            <div className="profile-edit-heading">
              <div>
                <h3>Edit Profile</h3>
                <p className="muted">Mobile number and skill level are managed by the club admin.</p>
              </div>
              <button className="button button-secondary button-small" type="button" onClick={cancelEditing}>Cancel</button>
            </div>
            <div className="field-grid">
              <label className="field">
                <span>Profile Picture</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleEditChange('profilePhotoFile', event.target.files?.[0] ?? null)}
                />
                <small className="field-help">Image only, maximum 2 MB.</small>
              </label>
              <label className="field">
                <span>Location</span>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(event) => handleEditChange('address', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Date Of Birth</span>
                <input
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(event) => handleEditChange('dateOfBirth', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Emergency Contact Name</span>
                <input
                  type="text"
                  value={editForm.emergencyContactName}
                  onChange={(event) => handleEditChange('emergencyContactName', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Emergency Contact Mobile</span>
                <input
                  type="tel"
                  value={editForm.emergencyContact}
                  onChange={(event) => handleEditChange('emergencyContact', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Mobile</span>
                <input type="text" value={profile.mobile ?? ''} disabled />
                <small className="field-help">Ask admin to change your registered mobile number.</small>
              </label>
            </div>
            <button className="button" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        ) : null}
      </section>

      <section className="card">
        <div className="card-header panel-heading">
          <div>
            <h2>Match History</h2>
            <p className="muted">This queries only the logged-in player's matches, ordered by newest first.</p>
          </div>
        </div>
        <MatchHistoryTable history={history} loading={loadingHistory} />
      </section>
    </section>
  );
}
