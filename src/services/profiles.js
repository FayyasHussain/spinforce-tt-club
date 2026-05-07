import { supabase } from '../lib/supabase.js';

export async function getUserProfile(authUserId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, mobile, address, skill_level, auth_user_id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function listPlayers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, skill_level')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listLeaderboard() {
  const { data, error } = await supabase
    .from('player_rankings')
    .select('*')
    .order('points', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}
