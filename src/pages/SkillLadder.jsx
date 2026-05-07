import { useRef, useState } from 'react';
import { getSkillLevelLabel, skillLevelOptions } from '../data/skillLevels.js';
import { saveMemberSkillProgress } from '../services/skills.js';

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
  loadingAuthData,
  loadingSkillLadder,
  skillError,
  onProgressSaved,
}) {
  const [expandedCategoryIds, setExpandedCategoryIds] = useState([]);
  const [savingSkillId, setSavingSkillId] = useState(null);
  const [message, setMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const categoryRefs = useRef(new Map());

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
  const totalSkills = skills.length;
  const startedCount = progress.filter((item) => Number(item.current_level) > 0).length;
  const matchReadyCount = progress.filter((item) => Number(item.current_level) >= 3).length;

  const toggleCategory = (categoryId) => {
    setExpandedCategoryIds((current) => (
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    ));
  };

  const openCategory = (categoryId) => {
    setExpandedCategoryIds((current) => (
      current.includes(categoryId) ? current : [...current, categoryId]
    ));

    window.requestAnimationFrame(() => {
      categoryRefs.current.get(categoryId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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
              savingSkillId={savingSkillId}
              onToggle={() => toggleCategory(category.id)}
              onSave={saveProgress}
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

function SkillCategorySection({ category, stats, isExpanded, progressBySkillId, savingSkillId, onToggle, onSave, setRef }) {
  return (
    <section className="card skill-category-card" ref={setRef}>
      <button className="skill-category-toggle" type="button" onClick={onToggle} aria-expanded={isExpanded}>
        <div>
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
            isSaving={savingSkillId === skill.id}
            onSave={onSave}
          />
        ))}
      </div>
    </section>
  );
}

function SkillItem({ skill, progress, isSaving, onSave }) {
  const [currentLevel, setCurrentLevel] = useState(Number(progress?.current_level ?? 0));
  const [remarks, setRemarks] = useState(progress?.remarks ?? '');

  return (
    <article className="skill-item">
      <div className="skill-item-main">
        <div>
          <div className="skill-title-row">
            <strong>{skill.name}</strong>
            <span className={`level-pill level-${currentLevel}`}>{getSkillLevelLabel(currentLevel)}</span>
          </div>
          <p>{skill.description ?? ''}</p>
        </div>
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
            <span>Practice Note</span>
            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              rows="2"
              placeholder="What changed? What should you remember next time?"
              disabled={isSaving}
            />
          </label>
        </div>
        <button className="button button-small" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Progress'}</button>
      </form>
    </article>
  );
}
