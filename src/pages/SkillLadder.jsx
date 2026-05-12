import { useEffect, useRef, useState } from 'react';
import { getSkillLevelLabel, skillLevelOptions } from '../data/skillLevels.js';
import { deleteSkillMedia, updateSkillMediaCaption, uploadSkillMedia } from '../services/media.js';
import { ensureMemberSkillProgress, saveMemberSkillProgress } from '../services/skills.js';

function getYouTubeEmbedUrl(url) {
  if (!url) {
    return '';
  }

  try {
    const parsedUrl = new URL(url);
    const videoId = parsedUrl.hostname.includes('youtu.be')
      ? parsedUrl.pathname.replace('/', '')
      : parsedUrl.searchParams.get('v');

    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  } catch {
    return '';
  }
}

function getSkillReferenceVideos(skill) {
  const referenceVideos = Array.isArray(skill.reference_videos) ? skill.reference_videos : [];

  return referenceVideos
    .map((video) => {
      const embedUrl = getYouTubeEmbedUrl(video.url);
      return embedUrl ? { ...video, embedUrl } : null;
    })
    .filter(Boolean);
}

function getCategoryStats(category, skills, progressBySkillId) {
  const categorySkills = skills.filter((skill) => skill.category_id === category.id);
  const totalCount = categorySkills.length;
  const startedCount = categorySkills.filter((skill) => Number(progressBySkillId.get(skill.id)?.current_level ?? 0) > 0).length;
  const matchReadyCount = categorySkills.filter((skill) => Number(progressBySkillId.get(skill.id)?.current_level ?? 0) >= 3).length;
  const progressPercent = totalCount ? Math.round((startedCount / totalCount) * 100) : 0;

  return {
    categorySkills,
    totalCount,
    startedCount,
    matchReadyCount,
    progressPercent,
  };
}

export function SkillLadder({
  profile,
  categories,
  skills,
  progress,
  skillMedia,
  loadingAuthData,
  loadingSkillLadder,
  skillError,
  onProgressSaved,
  onMediaUploaded,
  onMediaUpdated,
  onMediaDeleted,
}) {
  const [expandedCategoryIds, setExpandedCategoryIds] = useState([]);
  const [expandedSkillId, setExpandedSkillId] = useState(null);
  const [savingSkillId, setSavingSkillId] = useState(null);
  const [uploadingSkillId, setUploadingSkillId] = useState(null);
  const [workingMediaId, setWorkingMediaId] = useState(null);
  const [message, setMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const categoryRefs = useRef(new Map());
  const categoryIds = categories.map((category) => category.id);
  const skillIds = skills.map((skill) => skill.id);

  useEffect(() => {
    setExpandedSkillId(null);
  }, [skillIds.join('|')]);

  if (loadingAuthData || loadingSkillLadder) {
    return (
      <section className="card panel">
        <div className="card-header">
          <div>
            <h2>Skill Ladder</h2>
            <p className="muted">Loading your table tennis skill ladder.</p>
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
            <h2>Skill Ladder</h2>
            <p className="muted">No linked player profile was found for this account.</p>
          </div>
        </div>
      </section>
    );
  }

  if (skillError && !categories.length && !skills.length) {
    return (
      <section className="card panel">
        <div className="card-header">
          <div>
            <h2>Skill Ladder</h2>
            <p className="muted">The skill ladder could not be loaded.</p>
          </div>
        </div>
        <p className="message error">{skillError}</p>
      </section>
    );
  }

  const progressBySkillId = new Map(progress.map((item) => [item.skill_id, item]));
  const mediaByProgressId = new Map();
  for (const item of skillMedia) {
    const rows = mediaByProgressId.get(item.progress_id) ?? [];
    rows.push(item);
    mediaByProgressId.set(item.progress_id, rows);
  }
  const totalSkills = skills.length;
  const startedCount = progress.filter((item) => Number(item.current_level) > 0).length;
  const matchReadyCount = progress.filter((item) => Number(item.current_level) >= 3).length;

  const toggleCategory = (categoryId) => {
    const categorySkillIds = skills
      .filter((skill) => skill.category_id === categoryId)
      .map((skill) => skill.id);

    setExpandedCategoryIds((current) => (
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    ));

    if (categorySkillIds.includes(expandedSkillId)) {
      setExpandedSkillId(null);
    }
  };

  const openCategory = (categoryId) => {
    setExpandedCategoryIds((current) => (
      current.includes(categoryId) ? current : [...current, categoryId]
    ));

    window.requestAnimationFrame(() => {
      categoryRefs.current.get(categoryId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const toggleSkill = (skillId) => {
    setExpandedSkillId((current) => (current === skillId ? null : skillId));
  };

  const expandAllCategories = () => {
    setExpandedCategoryIds(categoryIds);
    setExpandedSkillId(null);
  };

  const collapseAll = () => {
    setExpandedCategoryIds([]);
    setExpandedSkillId(null);
  };

  const saveProgress = async ({ skillId, currentLevel, remarks }) => {
    setSavingSkillId(skillId);
    setMessage('');
    setSaveError('');

    try {
      const saved = await saveMemberSkillProgress({
        profileId: profile.id,
        skillId,
        currentLevel,
        remarks,
      });
      onProgressSaved(saved);
      setMessage('Skill progress saved.');
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSavingSkillId(null);
    }
  };

  const saveSkillMedia = async ({ skill, file, caption }) => {
    setUploadingSkillId(skill.id);
    setMessage('');
    setSaveError('');

    try {
      const savedProgress = progressBySkillId.get(skill.id)
        ?? await ensureMemberSkillProgress({ profileId: profile.id, skillId: skill.id });
      const uploadedMedia = await uploadSkillMedia({
        profileId: profile.id,
        progressId: savedProgress.id,
        skillId: skill.id,
        file,
        caption,
      });
      onMediaUploaded({ progress: savedProgress, media: uploadedMedia });
      setMessage('Media uploaded for skill review.');
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setUploadingSkillId(null);
    }
  };

  const saveMediaCaption = async ({ mediaItem, caption }) => {
    setWorkingMediaId(mediaItem.id);
    setMessage('');
    setSaveError('');

    try {
      const updatedMedia = await updateSkillMediaCaption({ mediaItem, caption });
      onMediaUpdated(updatedMedia);
      setMessage('Practice note updated.');
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setWorkingMediaId(null);
    }
  };

  const removeSkillMedia = async (mediaItem) => {
    setWorkingMediaId(mediaItem.id);
    setMessage('');
    setSaveError('');

    try {
      const deletedMediaId = await deleteSkillMedia(mediaItem);
      onMediaDeleted(deletedMediaId);
      setMessage('Practice media deleted.');
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setWorkingMediaId(null);
    }
  };

  return (
    <section className="stack">
      <section className="card panel">
        <div className="card-header">
          <div>
            <h2>Skill Ladder</h2>
            <p className="muted">Update your current level for each skill. Notes stay attached to that skill for later review.</p>
          </div>
        </div>
        <div className="skill-summary-grid">
          <div>
            <strong>{totalSkills}</strong>
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
        <div className="skill-ladder-controls">
          <button className="button button-secondary button-small" type="button" onClick={expandAllCategories}>Expand All</button>
          <button className="button button-secondary button-small" type="button" onClick={collapseAll}>Collapse All</button>
        </div>
        {message ? <p className="message success">{message}</p> : null}
        {saveError ? <p className="message error">{saveError}</p> : null}
        {skillError ? <p className="message error">{skillError}</p> : null}
      </section>

      <section className="card panel">
        <div className="card-header">
          <div>
            <h2>Category Progress</h2>
            <p className="muted">Use this map to choose one area at a time instead of scrolling through every skill.</p>
          </div>
        </div>
        <div className="skill-overview-grid">
          {categories.map((category) => (
            <CategoryOverview
              key={category.id}
              category={category}
              stats={getCategoryStats(category, skills, progressBySkillId)}
              isExpanded={expandedCategoryIds.includes(category.id)}
              onOpen={() => openCategory(category.id)}
            />
          ))}
        </div>
      </section>

      <section className="skill-category-list">
        {categories.map((category) => {
          const stats = getCategoryStats(category, skills, progressBySkillId);
          const isExpanded = expandedCategoryIds.includes(category.id);
          return (
            <SkillCategorySection
              key={category.id}
              category={category}
              stats={stats}
              isExpanded={isExpanded}
              progressBySkillId={progressBySkillId}
              mediaByProgressId={mediaByProgressId}
              savingSkillId={savingSkillId}
              uploadingSkillId={uploadingSkillId}
              workingMediaId={workingMediaId}
              expandedSkillId={expandedSkillId}
              onToggle={() => toggleCategory(category.id)}
              onToggleSkill={toggleSkill}
              onSave={saveProgress}
              onUpload={saveSkillMedia}
              onUpdateMedia={saveMediaCaption}
              onDeleteMedia={removeSkillMedia}
              setRef={(element) => {
                if (element) {
                  categoryRefs.current.set(category.id, element);
                }
              }}
            />
          );
        })}
      </section>
    </section>
  );
}

function CategoryOverview({ category, stats, isExpanded, onOpen }) {
  return (
    <button className={`skill-overview-card ${isExpanded ? 'active' : ''}`} type="button" onClick={onOpen} aria-expanded={isExpanded}>
      <span>{category.name}</span>
      <strong>{stats.progressPercent}%</strong>
      <div className="progress-track" aria-hidden="true">
        <div style={{ width: `${stats.progressPercent}%` }} />
      </div>
      <small>{stats.startedCount}/{stats.totalCount} started · {stats.matchReadyCount} match ready</small>
    </button>
  );
}

function SkillCategorySection({
  category,
  stats,
  isExpanded,
  progressBySkillId,
  mediaByProgressId,
  savingSkillId,
  uploadingSkillId,
  workingMediaId,
  expandedSkillId,
  onToggle,
  onToggleSkill,
  onSave,
  onUpload,
  onUpdateMedia,
  onDeleteMedia,
  setRef,
}) {
  return (
    <section className="card skill-category-card" ref={setRef}>
      <button className="skill-category-toggle" type="button" onClick={onToggle} aria-expanded={isExpanded}>
        <div>
          <span className="section-eyebrow">Skill Category</span>
          <h2>{category.name}</h2>
          <p className="muted">{category.description ?? ''}</p>
        </div>
        <div className="skill-category-stats">
          <span>{stats.startedCount}/{stats.totalCount} started</span>
          <span>{stats.matchReadyCount} match ready</span>
          <span className="expand-label">{isExpanded ? 'Collapse' : 'Expand'}</span>
        </div>
      </button>
      <div className={`skill-list ${isExpanded ? '' : 'collapsed'}`}>
        {stats.categorySkills.map((skill) => (
          <SkillItem
            key={skill.id}
            skill={skill}
            progress={progressBySkillId.get(skill.id)}
            mediaItems={mediaByProgressId.get(progressBySkillId.get(skill.id)?.id) ?? []}
            isExpanded={expandedSkillId === skill.id}
            isSaving={savingSkillId === skill.id}
            isUploading={uploadingSkillId === skill.id}
            workingMediaId={workingMediaId}
            onToggle={() => onToggleSkill(skill.id)}
            onSave={onSave}
            onUpload={onUpload}
            onUpdateMedia={onUpdateMedia}
            onDeleteMedia={onDeleteMedia}
          />
        ))}
      </div>
    </section>
  );
}

function SkillItem({ skill, progress, mediaItems, isExpanded, isSaving, isUploading, workingMediaId, onToggle, onSave, onUpload, onUpdateMedia, onDeleteMedia }) {
  const [currentLevel, setCurrentLevel] = useState(Number(progress?.current_level ?? 0));
  const [remarks, setRemarks] = useState(progress?.remarks ?? '');
  const [caption, setCaption] = useState('');
  const [showPracticeNotes, setShowPracticeNotes] = useState(false);
  const [activeReferenceVideo, setActiveReferenceVideo] = useState(null);
  const fileInputId = `skill-media-${skill.id}`;
  const referenceVideos = getSkillReferenceVideos(skill);

  return (
    <article className="skill-item">
      <button className="skill-item-toggle" type="button" aria-expanded={isExpanded} onClick={onToggle}>
        <div>
          <span className="section-eyebrow skill-eyebrow">Skill</span>
          <h3>{skill.name}</h3>
        </div>
        <span className="skill-toggle-meta">
          <span className={`level-pill level-${currentLevel}`}>{getSkillLevelLabel(currentLevel)}</span>
          <small>{isExpanded ? 'Collapse' : 'Expand'}</small>
        </span>
      </button>

      {isExpanded ? (
        <>
          <section className="skill-reference-section">
            <div>
              <span className="skill-section-label">Static Content</span>
              <h4>Skill Reference</h4>
              <p>{skill.description ?? ''}</p>
            </div>
            {referenceVideos.length ? (
              <div className="reference-video-list">
                {referenceVideos.map((video) => (
                  <button className="reference-video-card" type="button" key={video.url} onClick={() => setActiveReferenceVideo(video)}>
                    <span className="play-mark" aria-hidden="true">▶</span>
                    <span>
                      <strong>{video.title}</strong>
                      <small>{video.label}</small>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <button className="button button-secondary button-small" type="button" disabled>Reference Video Coming Soon</button>
            )}
          </section>

          <section className="player-skill-section">
            <div className="player-skill-header">
              <div>
                <span className="skill-section-label">Player Data</span>
                <h4>Player Skill Status</h4>
              </div>
              <button className="button button-secondary button-small" type="button" onClick={() => setShowPracticeNotes((current) => !current)}>
                {showPracticeNotes ? 'Hide Practice Notes' : `See Practice Notes${mediaItems.length ? ` (${mediaItems.length})` : ''}`}
              </button>
            </div>

            <form
              className="skill-progress-form"
              onSubmit={(event) => {
                event.preventDefault();
                onSave({ skillId: skill.id, currentLevel, remarks: remarks.trim() });
              }}
            >
              <div className="skill-form-grid">
                <label className="field">
                  <span>Current Level</span>
                  <select value={currentLevel} onChange={(event) => setCurrentLevel(Number(event.target.value))} disabled={isSaving}>
                    {skillLevelOptions.map((option) => (
                      <option value={option.value} key={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Current Practice Focus</span>
                  <textarea
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    rows="2"
                    placeholder="What are you working on for this skill?"
                    disabled={isSaving}
                  />
                </label>
              </div>
              <button className="button button-small" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Status'}</button>
            </form>
          </section>

          {showPracticeNotes ? (
            <section className="practice-notes-panel">
              <div className="practice-notes-heading">
                <div>
                  <h4>Practice Notes</h4>
                  <p className="muted">Add practice clips, technique photos, and notes for review. Latest notes stay at the top.</p>
                </div>
              </div>
              <form
                className="skill-media-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  const file = formData.get('mediaFile');
                  if (!(file instanceof File) || !file.size) {
                    return;
                  }
                  onUpload({ skill, file, caption: caption.trim() });
                  event.currentTarget.reset();
                  setCaption('');
                }}
              >
                <div className="skill-media-controls">
                  <label className="field">
                    <span>Practice Media</span>
                    <input id={fileInputId} name="mediaFile" type="file" accept="image/*,video/*" disabled={isUploading} />
                  </label>
                  <label className="field">
                    <span>Practice Note</span>
                    <input
                      type="text"
                      value={caption}
                      onChange={(event) => setCaption(event.target.value)}
                      placeholder="What did you learn from this practice?"
                      disabled={isUploading}
                    />
                  </label>
                </div>
                <button className="button button-secondary button-small" type="submit" disabled={isUploading}>{isUploading ? 'Uploading...' : 'Add Practice Note'}</button>
              </form>
              {mediaItems.length ? (
                <SkillMediaGallery
                  mediaItems={mediaItems}
                  workingMediaId={workingMediaId}
                  onUpdateMedia={onUpdateMedia}
                  onDeleteMedia={onDeleteMedia}
                />
              ) : <p className="empty-note">No practice notes yet for this skill.</p>}
            </section>
          ) : null}
        </>
      ) : null}

      {activeReferenceVideo ? (
        <ReferenceVideoModal
          video={activeReferenceVideo}
          onClose={() => setActiveReferenceVideo(null)}
        />
      ) : null}
    </article>
  );
}

function ReferenceVideoModal({ video, onClose }) {
  return (
    <div className="video-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="video-modal" role="dialog" aria-modal="true" aria-label={video.title} onClick={(event) => event.stopPropagation()}>
        <div className="video-modal-header">
          <div>
            <span className="skill-section-label">Reference Video</span>
            <h3>{video.title}</h3>
          </div>
          <button className="button button-secondary button-small" type="button" onClick={onClose}>Close</button>
        </div>
        <iframe
          src={video.embedUrl}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </section>
    </div>
  );
}

function SkillMediaGallery({ mediaItems, workingMediaId, onUpdateMedia, onDeleteMedia }) {
  return (
    <div className="skill-media-gallery">
      {mediaItems.map((item) => (
        <SkillMediaCard
          key={item.id}
          item={item}
          isWorking={workingMediaId === item.id}
          onUpdateMedia={onUpdateMedia}
          onDeleteMedia={onDeleteMedia}
        />
      ))}
    </div>
  );
}

function SkillMediaCard({ item, isWorking, onUpdateMedia, onDeleteMedia }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nextCaption, setNextCaption] = useState(item.caption || item.media?.description || '');

  const displayCaption = item.caption || item.media?.description || item.media?.title || 'Skill media';

  return (
    <article className="skill-media-card">
      {item.signedUrl ? (
        item.media?.type === 1 ? (
          <video src={item.signedUrl} controls playsInline />
        ) : (
          <img src={item.signedUrl} alt={displayCaption} />
        )
      ) : (
        <div className="skill-media-unavailable">Preview unavailable</div>
      )}
      <div className="skill-media-card-body">
        {isEditing ? (
          <form
            className="skill-media-edit-form"
            onSubmit={(event) => {
              event.preventDefault();
              onUpdateMedia({ mediaItem: item, caption: nextCaption.trim() });
              setIsEditing(false);
            }}
          >
            <label className="field">
              <span>Practice Note</span>
              <input value={nextCaption} onChange={(event) => setNextCaption(event.target.value)} disabled={isWorking} />
            </label>
            <div className="skill-media-actions">
              <button className="button button-small" type="submit" disabled={isWorking}>{isWorking ? 'Saving...' : 'Save'}</button>
              <button
                className="button button-secondary button-small"
                type="button"
                disabled={isWorking}
                onClick={() => {
                  setNextCaption(item.caption || item.media?.description || '');
                  setIsEditing(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <strong>{displayCaption}</strong>
            {item.practice_date ? <span>{item.practice_date}</span> : null}
            <div className="skill-media-actions">
              <button className="button button-secondary button-small" type="button" disabled={isWorking} onClick={() => setIsEditing(true)}>Edit Note</button>
              <button
                className="button button-danger button-small"
                type="button"
                disabled={isWorking}
                onClick={() => {
                  if (window.confirm('Delete this practice media? This cannot be undone.')) {
                    onDeleteMedia(item);
                  }
                }}
              >
                {isWorking ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
