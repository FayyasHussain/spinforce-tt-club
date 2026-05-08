import { supabase } from '../lib/supabase.js';

export async function listSkillLadderData(profileId) {
  const [categoriesResult, skillsResult, progressResult] = await Promise.all([
    supabase
      .from('skill_categories')
      .select('id, name, description, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('skills')
      .select('id, category_id, name, description, difficulty_level, sort_order, reference_videos')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('member_skill_progress')
      .select('id, profile_id, skill_id, current_level, target_level, self_rating, status, remarks, last_practiced_at, updated_at')
      .eq('profile_id', profileId),
  ]);

  const error = categoriesResult.error ?? skillsResult.error ?? progressResult.error;

  if (error) {
    throw error;
  }

  const progress = progressResult.data ?? [];

  return {
    categories: categoriesResult.data ?? [],
    skills: skillsResult.data ?? [],
    progress,
  };
}

export async function ensureMemberSkillProgress({ profileId, skillId }) {
  const { data, error } = await supabase
    .from('member_skill_progress')
    .upsert(
      {
        profile_id: profileId,
        skill_id: skillId,
      },
      { onConflict: 'profile_id,skill_id' },
    )
    .select('id, profile_id, skill_id, current_level, target_level, self_rating, status, remarks, last_practiced_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveMemberSkillProgress({ profileId, skillId, currentLevel, remarks }) {
  const { data, error } = await supabase
    .from('member_skill_progress')
    .upsert(
      {
        profile_id: profileId,
        skill_id: skillId,
        current_level: currentLevel,
        remarks: remarks || null,
        last_practiced_at: currentLevel > 0 ? new Date().toISOString() : null,
      },
      { onConflict: 'profile_id,skill_id' },
    )
    .select('id, profile_id, skill_id, current_level, target_level, self_rating, status, remarks, last_practiced_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
