import { useEffect, useMemo, useState } from 'react';
import { MatchHistoryTable } from '../components/MatchHistoryTable.jsx';
import { getSkillLevelLabel } from '../data/skillLevels.js';
import { listMemberMatches } from '../services/matches.js';
import { listSkillMedia } from '../services/media.js';
import { getProfileById, listAdminPlayers, listCoachAssignedPlayers, listLeaderboard } from '../services/profiles.js';
import { listSkillComments, listSkillLadderData } from '../services/skills.js';
import { buildMatchHistory } from '../utils/matchHistory.js';

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

export function AdminPlayers({ isAdmin }) {
  return (
    <PlayerReview
      canAccess={isAdmin}
      mode="admin"
      title="Player Profiles"
      eyebrow="Admin"
      heroCopy="Review member details and match history from one admin view."
      mobileHeroCopy="Review player details and match history."
      emptyMessage="No players found."
      unavailableTitle="Admin"
      unavailableMessage="This area is available only to club admins."
    />
  );
}

export function CoachingPlayers({ isCoach, coachProfileId }) {
  return (
    <PlayerReview
      canAccess={isCoach}
      coachProfileId={coachProfileId}
      mode="coach"
      title="Coaching"
      eyebrow="Coaching"
      heroCopy="Review assigned players, skill progress, notes, media, and match history."
      mobileHeroCopy="Review assigned players and skill progress."
      emptyMessage="No assigned players found."
      unavailableTitle="Coaching"
      unavailableMessage="This area is available only to coaches."
    />
  );
}

function PlayerReview({
  canAccess,
  coachProfileId,
  mode,
  title,
  eyebrow,
  heroCopy,
  mobileHeroCopy,
  emptyMessage,
  unavailableTitle,
  unavailableMessage,
}) {
  const [activeTab, setActiveTab] = useState('profile');
  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillProgress, setSkillProgress] = useState([]);
  const [skillMedia, setSkillMedia] = useState([]);
  const [skillComments, setSkillComments] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!canAccess) {
      return;
    }

    let mounted = true;

    const loadPlayers = async () => {
      setLoadingPlayers(true);
      setError('');

      try {
        const nextPlayers = mode === 'coach'
          ? await listCoachAssignedPlayers(coachProfileId)
          : await listAdminPlayers();

        if (!mounted) {
          return;
        }

        setPlayers(nextPlayers);
        setSelectedPlayerId((current) => (
          nextPlayers.some((player) => player.id === current) ? current : nextPlayers[0]?.id ?? null
        ));
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message);
          setPlayers([]);
        }
      } finally {
        if (mounted) {
          setLoadingPlayers(false);
        }
      }
    };

    loadPlayers();

    return () => {
      mounted = false;
    };
  }, [canAccess, coachProfileId, mode]);

  useEffect(() => {
    if (!canAccess || !selectedPlayerId) {
      setSelectedProfile(null);
      setHistory([]);
      setSkillCategories([]);
      setSkills([]);
      setSkillProgress([]);
      setSkillMedia([]);
      setSkillComments([]);
      return;
    }

    let mounted = true;

    const loadProfile = async () => {
      setLoadingProfile(true);
      setError('');

      try {
        const [profile, matches, leaderboard] = await Promise.all([
          getProfileById(selectedPlayerId),
          listMemberMatches(),
          listLeaderboard(),
        ]);
        const ladderData = profile ? await listSkillLadderData(profile.id) : { categories: [], skills: [], progress: [] };
        const progressIds = ladderData.progress.map((item) => item.id);
        const [media, comments] = await Promise.all([
          listSkillMedia(progressIds),
          listSkillComments(progressIds),
        ]);

        if (!mounted) {
          return;
        }

        setSelectedProfile(profile);
        setHistory(profile ? buildMatchHistory(matches, profile, leaderboard) : []);
        setSkillCategories(ladderData.categories);
        setSkills(ladderData.skills);
        setSkillProgress(ladderData.progress);
        setSkillMedia(media);
        setSkillComments(comments);
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message);
          setSelectedProfile(null);
          setHistory([]);
          setSkillCategories([]);
          setSkills([]);
          setSkillProgress([]);
          setSkillMedia([]);
          setSkillComments([]);
        }
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [canAccess, selectedPlayerId]);

  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId),
    [players, selectedPlayerId],
  );

  if (!canAccess) {
    return (
      <section className="card panel">
        <div className="card-header">
          <div>
            <h2>{unavailableTitle}</h2>
            <p className="muted">{unavailableMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  const profileDetails = selectedProfile ? [
    { label: 'Mobile', value: selectedProfile.mobile },
    { label: 'Location', value: selectedProfile.address },
    { label: 'Skill Level', value: selectedProfile.skill_level },
    { label: 'Roles', value: selectedProfile.roles?.join(', ') },
    { label: 'Date Of Birth', value: formatDate(selectedProfile.date_of_birth) },
    { label: 'Age', value: calculateAge(selectedProfile.date_of_birth) },
    { label: 'Emergency Contact', value: emergencyContactValue(selectedProfile) },
    { label: 'Parent / Guardian', value: selectedProfile.parent_guardian_name },
  ].filter((item) => item.value) : [];

  return (
    <section className="stack">
      <section className="card panel dashboard-hero">
        <div>
          <p className="eyebrow dark">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="muted dashboard-lead-full">{heroCopy}</p>
          <p className="muted dashboard-lead-mobile">{mobileHeroCopy}</p>
        </div>
      </section>

      {error ? <p className="message error">{error}</p> : null}

      <section className="admin-player-layout">
        <aside className="card panel admin-player-list">
          <div className="card-header">
            <div>
              <h2>Players</h2>
              <p className="muted">{loadingPlayers ? 'Loading players.' : `${players.length} player records`}</p>
            </div>
          </div>
          <div className="admin-player-list-items">
            {players.map((player) => (
              <button
                key={player.id}
                className={`admin-player-row ${player.id === selectedPlayerId ? 'active' : ''}`}
                type="button"
                onClick={() => setSelectedPlayerId(player.id)}
              >
                <span>{initialsForName(player.name)}</span>
                <div>
                  <strong>{player.name}</strong>
                  <small>{player.skill_level || 'Skill level not set'}{player.mobile ? ` · ${player.mobile}` : ''}</small>
                </div>
              </button>
            ))}
            {!loadingPlayers && !players.length ? <p className="message">{emptyMessage}</p> : null}
          </div>
        </aside>

        <section className="stack">
          <section className="card panel">
            {loadingProfile ? (
              <div className="card-header">
                <div>
                  <h2>{selectedPlayer?.name || 'Player Profile'}</h2>
                  <p className="muted">Loading profile details.</p>
                </div>
              </div>
            ) : selectedProfile ? (
              <>
                <div className="profile-summary">
                  <div className="profile-photo-frame">
                    {selectedProfile.profile_photo_url ? (
                      <img src={selectedProfile.profile_photo_url} alt={`${selectedProfile.name} profile`} />
                    ) : (
                      <span>{initialsForName(selectedProfile.name)}</span>
                    )}
                  </div>
                  <div className="profile-summary-copy">
                    <p className="eyebrow dark">Player Profile</p>
                    <h2>{selectedProfile.name}</h2>
                    <p className="muted">{mode === 'coach' ? 'Coaching view of assigned player details.' : 'Admin view of club member details.'}</p>
                  </div>
                </div>
                <div className="admin-tabs" role="tablist" aria-label="Admin player sections">
                  <button className={activeTab === 'profile' ? 'active' : ''} type="button" onClick={() => setActiveTab('profile')}>Profile</button>
                  <button className={activeTab === 'skills' ? 'active' : ''} type="button" onClick={() => setActiveTab('skills')}>Skills</button>
                  <button className={activeTab === 'matches' ? 'active' : ''} type="button" onClick={() => setActiveTab('matches')}>Matches</button>
                </div>
                {activeTab === 'profile' ? (
                  <dl className="profile-detail-grid">
                    {profileDetails.map((item) => (
                      <div key={item.label}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {activeTab === 'skills' ? (
                  <AdminSkillReview
                    categories={skillCategories}
                    skills={skills}
                    progress={skillProgress}
                    skillMedia={skillMedia}
                    skillComments={skillComments}
                  />
                ) : null}
                {activeTab === 'matches' ? (
                  <MatchHistoryTable history={history} loading={loadingProfile} />
                ) : null}
              </>
            ) : (
              <p className="message">Select a player to view their profile.</p>
            )}
          </section>

        </section>
      </section>
    </section>
  );
}

function AdminSkillReview({ categories, skills, progress, skillMedia, skillComments }) {
  const [expandedCategoryIds, setExpandedCategoryIds] = useState([]);
  const [expandedSkillIds, setExpandedSkillIds] = useState([]);
  const progressBySkillId = new Map(progress.map((item) => [item.skill_id, item]));
  const mediaByProgressId = groupByProgressId(skillMedia);
  const commentsByProgressId = groupByProgressId(skillComments);
  const startedCount = progress.filter((item) => Number(item.current_level) > 0).length;
  const matchReadyCount = progress.filter((item) => Number(item.current_level) >= 3).length;
  const categoryIds = categories.map((category) => category.id);
  const skillIds = skills.map((skill) => skill.id);

  useEffect(() => {
    setExpandedCategoryIds(categoryIds);
    setExpandedSkillIds([]);
  }, [categoryIds.join('|'), skillIds.join('|')]);

  const toggleCategory = (categoryId) => {
    setExpandedCategoryIds((current) => (
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    ));
  };

  const toggleSkill = (skillId) => {
    setExpandedSkillIds((current) => (
      current.includes(skillId) ? [] : [skillId]
    ));
  };

  const expandAll = () => {
    setExpandedCategoryIds(categoryIds);
    setExpandedSkillIds(skillIds);
  };

  const collapseAll = () => {
    setExpandedCategoryIds([]);
    setExpandedSkillIds([]);
  };

  return (
    <section className="admin-skill-review">
      <div className="skill-summary-grid">
        <div>
          <strong>{skills.length}</strong>
          <span>Total Skills</span>
        </div>
        <div>
          <strong>{startedCount}</strong>
          <span>Started</span>
        </div>
        <div>
          <strong>{matchReadyCount}</strong>
          <span>Match Ready+</span>
        </div>
      </div>

      {categories.length ? (
        <div className="admin-skill-controls">
          <button className="button button-secondary button-small" type="button" onClick={expandAll}>Expand All</button>
          <button className="button button-secondary button-small" type="button" onClick={collapseAll}>Collapse All</button>
        </div>
      ) : null}

      {categories.map((category) => {
        const categorySkills = skills.filter((skill) => skill.category_id === category.id);
        const isCategoryExpanded = expandedCategoryIds.includes(category.id);

        return (
          <section className="admin-skill-category" key={category.id}>
            <button
              className="admin-skill-category-heading"
              type="button"
              aria-expanded={isCategoryExpanded}
              onClick={() => toggleCategory(category.id)}
            >
              <div>
                <span className="section-eyebrow">Skill Category</span>
                <h3>{category.name}</h3>
              </div>
              <span className="admin-skill-category-actions">
                <strong>{categorySkills.filter((skill) => Number(progressBySkillId.get(skill.id)?.current_level ?? 0) > 0).length}/{categorySkills.length} started</strong>
                <small>{isCategoryExpanded ? 'Collapse' : 'Expand'}</small>
              </span>
            </button>
            {isCategoryExpanded ? (
              <div className="admin-skill-list">
                {categorySkills.map((skill) => {
                  const skillStatus = progressBySkillId.get(skill.id);
                  const mediaItems = mediaByProgressId.get(skillStatus?.id) ?? [];
                  const comments = commentsByProgressId.get(skillStatus?.id) ?? [];
                  const isSkillExpanded = expandedSkillIds.includes(skill.id);

                  return (
                    <AdminSkillItem
                      key={skill.id}
                      skill={skill}
                      progress={skillStatus}
                      mediaItems={mediaItems}
                      comments={comments}
                      isExpanded={isSkillExpanded}
                      onToggle={() => toggleSkill(skill.id)}
                    />
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}
      {!categories.length ? <p className="message">No skill ladder data found.</p> : null}
    </section>
  );
}

function AdminSkillItem({ skill, progress, mediaItems, comments, isExpanded, onToggle }) {
  const currentLevel = Number(progress?.current_level ?? 0);
  const progressDetails = [
    { label: 'Current Level', value: getSkillLevelLabel(currentLevel) },
    { label: 'Target Level', value: progress?.target_level ? getSkillLevelLabel(Number(progress.target_level)) : '' },
    { label: 'Status', value: progress?.status },
    { label: 'Last Practiced', value: formatDateTime(progress?.last_practiced_at) },
    { label: 'Updated', value: formatDateTime(progress?.updated_at) },
  ].filter((item) => item.value);

  return (
    <article className="admin-skill-item">
      <button className="admin-skill-item-toggle" type="button" aria-expanded={isExpanded} onClick={onToggle}>
        <div>
          <span className="section-eyebrow skill-eyebrow">Skill</span>
          <h3>{skill.name}</h3>
        </div>
        <span className="admin-skill-toggle-meta">
          <span className={`level-pill level-${currentLevel}`}>{getSkillLevelLabel(currentLevel)}</span>
          <small>{isExpanded ? 'Collapse' : 'Expand'}</small>
        </span>
      </button>
      {isExpanded ? (
        <>
          {skill.description ? <p className="muted admin-skill-description">{skill.description}</p> : null}
          <dl className="admin-skill-meta">
            {progressDetails.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          <section className="admin-note-panel">
            <span className="skill-section-label">Player Note</span>
            <p>{progress?.remarks || 'No player note yet.'}</p>
          </section>
          <section className="admin-note-panel">
            <span className="skill-section-label">Comments</span>
            {comments.length ? (
              <div className="admin-comment-list">
                {comments.map((item) => (
                  <article key={item.id} className="admin-comment">
                    <strong>{item.comment?.profile?.name || 'Club member'}</strong>
                    <p>{getCommentBody(item.comment)}</p>
                    <span>{item.comment_type || 'comment'} · {formatDateTime(item.created_at)}</span>
                  </article>
                ))}
              </div>
            ) : (
              <p>No comments yet.</p>
            )}
          </section>
          <section className="admin-note-panel">
            <span className="skill-section-label">Practice Media</span>
            {mediaItems.length ? (
              <div className="skill-media-gallery admin-media-gallery">
                {mediaItems.map((item) => (
                  <article className="skill-media-card" key={item.id}>
                    {item.signedUrl ? (
                      item.media?.type === 1 ? (
                        <video src={item.signedUrl} controls playsInline />
                      ) : (
                        <img src={item.signedUrl} alt={item.caption || item.media?.title || skill.name} />
                      )
                    ) : (
                      <div className="skill-media-unavailable">Preview unavailable</div>
                    )}
                    <div className="skill-media-card-body">
                      <strong>{item.caption || item.media?.description || item.media?.title || 'Practice media'}</strong>
                      {item.practice_date ? <span>{item.practice_date}</span> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p>No practice media yet.</p>
            )}
          </section>
        </>
      ) : null}
    </article>
  );
}

function groupByProgressId(items) {
  const groups = new Map();

  for (const item of items) {
    const rows = groups.get(item.progress_id) ?? [];
    rows.push(item);
    groups.set(item.progress_id, rows);
  }

  return groups;
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getCommentBody(comment) {
  if (comment?.body) {
    return comment.body;
  }

  if (typeof comment?.content?.body === 'string') {
    return comment.content.body;
  }

  return 'No comment body.';
}
