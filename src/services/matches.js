import { supabase } from '../lib/supabase.js';

export async function createCompletedMatch({ profileId, opponentId, bestOf, pointsToWin, sets, winnerId }) {
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .insert({
      player1_id: profileId,
      player2_id: opponentId,
      best_of: bestOf,
      points_to_win: pointsToWin,
      status: 'completed',
    })
    .select('id')
    .single();

  if (matchError) {
    throw matchError;
  }

  const { error: scoreError } = await supabase.from('match_scores').insert({
    match_id: match.id,
    scorecard: {
      player1_id: profileId,
      player2_id: opponentId,
      sets,
      match_winner_id: winnerId,
    },
  });

  if (scoreError) {
    throw scoreError;
  }

  return match;
}

export async function listMemberMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id,
      match_date,
      best_of,
      points_to_win,
      player1_id,
      player2_id,
      score:match_scores (
        scorecard,
        winner_id
      ),
      player1:profiles!matches_player1_id_fkey (
        id,
        name
      ),
      player2:profiles!matches_player2_id_fkey (
        id,
        name
      )
    `)
    .order('match_date', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}
