export function buildMatchHistory(matches, profile, leaderboard) {
  const rankingsById = new Map(
    leaderboard.map((player, index) => [player.id, index + 1]),
  );

  return (matches ?? []).flatMap((match) => {
    const score = Array.isArray(match.score) ? match.score[0] : match.score;

    if (!score?.scorecard?.sets) {
      return [];
    }

    const isPlayerOne = match.player1_id === profile.id;
    const isPlayerTwo = match.player2_id === profile.id;

    if (!isPlayerOne && !isPlayerTwo) {
      return [];
    }

    const opponent = isPlayerOne ? match.player2 : match.player1;
    const sets = Array.isArray(score.scorecard.sets) ? score.scorecard.sets : [];
    let playerGamesWon = 0;
    let opponentGamesWon = 0;

    for (const set of sets) {
      if (!Array.isArray(set) || set.length !== 2) {
        continue;
      }

      const playerPoints = isPlayerOne ? Number(set[0]) : Number(set[1]);
      const opponentPoints = isPlayerOne ? Number(set[1]) : Number(set[0]);

      if (playerPoints > opponentPoints) {
        playerGamesWon += 1;
      } else if (opponentPoints > playerPoints) {
        opponentGamesWon += 1;
      }
    }

    const setSummary = sets
      .map((set) => {
        if (!Array.isArray(set) || set.length !== 2) {
          return null;
        }

        const playerPoints = isPlayerOne ? Number(set[0]) : Number(set[1]);
        const opponentPoints = isPlayerOne ? Number(set[1]) : Number(set[0]);
        return `${playerPoints}-${opponentPoints}`;
      })
      .filter(Boolean)
      .join(', ');

    return [{
      id: match.id,
      opponentName: opponent?.name ?? 'Unknown player',
      opponentRank: opponent?.id ? rankingsById.get(opponent.id) : null,
      result: score.winner_id === profile.id ? 'Won' : 'Lost',
      score: `${playerGamesWon}-${opponentGamesWon}`,
      setSummary,
      formatSummary: `Best of ${match.best_of} · ${match.points_to_win} point game`,
      matchDate: match.match_date,
    }];
  });
}
