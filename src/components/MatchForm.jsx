import { useMemo, useState } from 'react';
import { createCompletedMatch } from '../services/matches.js';

function createMatchForm(overrides = {}) {
  const bestOf = Number(overrides.bestOf ?? 5);
  const pointsToWin = Number(overrides.pointsToWin ?? 11);
  const safeBestOf = Number.isInteger(bestOf) && bestOf >= 1 && bestOf % 2 === 1 ? bestOf : 5;
  const safePoints = pointsToWin === 21 ? 21 : 11;
  const previousSets = overrides.sets ?? [];

  return {
    opponentId: String(overrides.opponentId ?? ''),
    bestOf: safeBestOf,
    pointsToWin: safePoints,
    sets: clearSetsAfterDecision(
      Array.from({ length: safeBestOf }, (_, index) => previousSets[index] ?? { winner: '', loserScore: '' }),
      safeBestOf,
    ),
  };
}

function isCompleteSet(setEntry) {
  return Boolean(setEntry?.winner && setEntry?.loserScore !== '');
}

function getMatchDecisionIndex(sets, bestOf) {
  const requiredWins = Math.floor(bestOf / 2) + 1;
  let player1Wins = 0;
  let player2Wins = 0;

  for (let index = 0; index < sets.length; index += 1) {
    const setEntry = sets[index];

    if (!isCompleteSet(setEntry)) {
      continue;
    }

    if (setEntry.winner === 'player1') {
      player1Wins += 1;
    } else if (setEntry.winner === 'player2') {
      player2Wins += 1;
    }

    if (player1Wins === requiredWins || player2Wins === requiredWins) {
      return index;
    }
  }

  return -1;
}

function clearSetsAfterDecision(sets, bestOf) {
  const decisionIndex = getMatchDecisionIndex(sets, bestOf);

  if (decisionIndex < 0) {
    return sets;
  }

  return sets.map((setEntry, index) => (
    index > decisionIndex ? { winner: '', loserScore: '' } : setEntry
  ));
}

function getMatchSummary(sets, bestOf, pointsToWin, yourName, opponentLabel) {
  const decisionIndex = getMatchDecisionIndex(sets, bestOf);

  if (decisionIndex < 0) {
    return null;
  }

  const completedSets = sets.slice(0, decisionIndex + 1);
  const player1Wins = completedSets.filter((setEntry) => setEntry.winner === 'player1').length;
  const player2Wins = completedSets.filter((setEntry) => setEntry.winner === 'player2').length;
  const winnerName = player1Wins > player2Wins ? yourName : opponentLabel;
  const scoreLine = completedSets
    .map((setEntry) => {
      const loserScore = Number(setEntry.loserScore);
      const player1Score = setEntry.winner === 'player1' ? pointsToWin : loserScore;
      const player2Score = setEntry.winner === 'player2' ? pointsToWin : loserScore;

      return `${player1Score}-${player2Score}`;
    })
    .join(', ');

  return {
    winnerName,
    games: `${player1Wins}-${player2Wins}`,
    scoreLine,
  };
}

export function MatchForm({ profile, players, loadingAuthData, onSaved }) {
  const [matchForm, setMatchForm] = useState(() => createMatchForm());
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const opponentOptions = useMemo(() => {
    if (!profile) {
      return [];
    }

    return players.filter((player) => player.id !== profile.id);
  }, [players, profile]);

  if (loadingAuthData) {
    return (
      <section className="card panel">
        <div className="card-header">
          <div>
            <h2>Submit Match</h2>
            <p className="muted">Loading your player profile and the opponent list.</p>
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
            <h2>Submit Match</h2>
            <p className="muted">Your auth user is not linked to a row in <code>profiles</code>. The app needs that row to know your player id.</p>
          </div>
        </div>
      </section>
    );
  }

  const selectedOpponent = players.find((player) => String(player.id) === matchForm.opponentId);
  const opponentLabel = selectedOpponent?.name ?? 'Opponent Profile';
  const matchSummary = getMatchSummary(
    matchForm.sets,
    matchForm.bestOf,
    matchForm.pointsToWin,
    profile.name,
    opponentLabel,
  );

  const updateConfig = (patch) => {
    setMatchForm((current) => createMatchForm({ ...current, ...patch }));
  };

  const updateSet = (setIndex, field, value) => {
    setMatchForm((current) => {
      const sets = current.sets.map((set, index) => {
        if (index !== setIndex) {
          return set;
        }

        if (field === 'winner') {
          return {
            winner: value,
            loserScore: value ? set.loserScore : '',
          };
        }

        return { ...set, [field]: value };
      });

      return createMatchForm({ ...current, sets: clearSetsAfterDecision(sets, current.bestOf) });
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const opponentId = Number(matchForm.opponentId);
    const bestOf = matchForm.bestOf;
    const pointsToWin = matchForm.pointsToWin;

    if (!opponentId) {
      setSubmitError('Select an opponent.');
      setSubmitMessage('');
      return;
    }

    const requiredWins = Math.floor(bestOf / 2) + 1;
    const sets = [];
    let player1Wins = 0;
    let player2Wins = 0;

    for (let gameNumber = 1; gameNumber <= bestOf; gameNumber += 1) {
      const setEntry = matchForm.sets[gameNumber - 1] ?? { winner: '', loserScore: '' };

      if (!setEntry.winner && setEntry.loserScore === '') {
        continue;
      }

      if (!setEntry.winner) {
        setSubmitError(`Game ${gameNumber} needs a selected winner.`);
        setSubmitMessage('');
        return;
      }

      if (setEntry.loserScore === '') {
        setSubmitError(`Game ${gameNumber} needs a losing score selection.`);
        setSubmitMessage('');
        return;
      }

      const loserScore = Number(setEntry.loserScore);

      if (!Number.isInteger(loserScore) || loserScore < 0 || loserScore >= pointsToWin - 1) {
        setSubmitError(`Game ${gameNumber} losing score must stay below ${pointsToWin - 1} in this simplified entry mode.`);
        setSubmitMessage('');
        return;
      }

      const player1Points = setEntry.winner === 'player1' ? pointsToWin : loserScore;
      const player2Points = setEntry.winner === 'player2' ? pointsToWin : loserScore;

      if (player1Points > player2Points) {
        player1Wins += 1;
      } else {
        player2Wins += 1;
      }

      sets.push([player1Points, player2Points]);

      if (player1Wins === requiredWins || player2Wins === requiredWins) {
        for (let remaining = gameNumber + 1; remaining <= bestOf; remaining += 1) {
          const leftoverSet = matchForm.sets[remaining - 1] ?? { winner: '', loserScore: '' };
          if (leftoverSet.winner || leftoverSet.loserScore !== '') {
            setSubmitError(`Stop entering scores after the match winner is decided. Extra scores found after Game ${gameNumber}.`);
            setSubmitMessage('');
            return;
          }
        }
        break;
      }
    }

    if (!sets.length || Math.max(player1Wins, player2Wins) !== requiredWins) {
      setSubmitError(`A best-of-${bestOf} match must end when one player reaches ${requiredWins} game wins.`);
      setSubmitMessage('');
      return;
    }

    setSubmitError('');
    setSubmitMessage('Saving match...');

    try {
      await createCompletedMatch({
        profileId: profile.id,
        opponentId,
        bestOf,
        pointsToWin,
        sets,
        winnerId: player1Wins > player2Wins ? profile.id : opponentId,
      });

      setMatchForm(createMatchForm());
      setSubmitMessage('Match saved successfully.');
      await onSaved();
    } catch (error) {
      setSubmitError(error.message);
      setSubmitMessage('');
    }
  };

  return (
    <section className="card panel">
      <div className="card-header">
        <div>
          <h2>Submit Match</h2>
          <p className="muted">Configure the match format first, then enter each game score. The app builds the scorecard JSON required by the Supabase schema.</p>
        </div>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Your Profile</span>
          <input type="text" value={profile.name} disabled />
        </label>
        <label className="field">
          <span>Opponent</span>
          <select value={matchForm.opponentId} onChange={(event) => updateConfig({ opponentId: event.target.value })} required>
            <option value="">Select opponent</option>
            {opponentOptions.map((player) => (
              <option value={player.id} key={player.id}>
                {player.name}{player.skill_level ? ` (${player.skill_level})` : ''}
              </option>
            ))}
          </select>
        </label>
        <div className="field-grid">
          <label className="field">
            <span>Match Format</span>
            <select value={matchForm.bestOf} onChange={(event) => updateConfig({ bestOf: Number(event.target.value) })}>
              {[1, 3, 5, 7, 9].map((value) => <option value={value} key={value}>Best of {value}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Points To Win</span>
            <select value={matchForm.pointsToWin} onChange={(event) => updateConfig({ pointsToWin: Number(event.target.value) })}>
              {[11, 21].map((value) => <option value={value} key={value}>{value} point game</option>)}
            </select>
          </label>
        </div>
        <div className="sets-editor">
          {matchForm.sets.map((setEntry, index) => (
            <SetRow
              key={index}
              index={index}
              pointsToWin={matchForm.pointsToWin}
              yourName={profile.name}
              opponentLabel={opponentLabel}
              setEntry={setEntry}
              isLocked={getMatchDecisionIndex(matchForm.sets.slice(0, index), matchForm.bestOf) >= 0}
              onChange={updateSet}
            />
          ))}
        </div>
        {matchSummary ? (
          <div className="match-summary">
            <span>Match result</span>
            <strong>{matchSummary.winnerName} wins {matchSummary.games}</strong>
            <small>{matchSummary.scoreLine}</small>
          </div>
        ) : null}
        {submitError ? <p className="message error">{submitError}</p> : null}
        {submitMessage ? <p className="message success">{submitMessage}</p> : null}
        <button className="button" type="submit">Save Match</button>
      </form>
    </section>
  );
}

function SetRow({ index, pointsToWin, yourName, opponentLabel, setEntry, isLocked, onChange }) {
  const gameNumber = index + 1;
  const losingScores = Array.from({ length: pointsToWin === 21 ? 20 : 10 }, (_, score) => score);

  return (
    <div className={`set-row ${isLocked ? 'locked' : ''}`}>
      <strong>G{gameNumber}</strong>
      <label className="set-inline-field">
        <span>Winner</span>
        <select value={setEntry.winner} onChange={(event) => onChange(index, 'winner', event.target.value)} disabled={isLocked}>
          <option value="">Winner</option>
          <option value="player1">{yourName}</option>
          <option value="player2">{opponentLabel}</option>
        </select>
      </label>
      <span className="winner-points">{setEntry.winner ? pointsToWin : '-'}</span>
      <span className="score-divider">|</span>
      <label className="set-inline-field">
        <span>Loser</span>
        <select value={setEntry.loserScore} onChange={(event) => onChange(index, 'loserScore', event.target.value)} disabled={isLocked || !setEntry.winner}>
          <option value="">Loser</option>
          {losingScores.map((score) => <option value={score} key={score}>{score}</option>)}
        </select>
      </label>
      <span className="set-score-preview">{isLocked ? 'Done' : ''}</span>
    </div>
  );
}
