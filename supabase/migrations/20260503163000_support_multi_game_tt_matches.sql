alter table "public"."matches"
  add column "best_of" integer not null default 5,
  add column "points_to_win" integer not null default 11;

alter table "public"."matches"
  add constraint "matches_best_of_odd_positive"
  check (best_of >= 1 and best_of % 2 = 1);

alter table "public"."matches"
  add constraint "matches_points_to_win_positive"
  check (points_to_win > 0);

alter table "public"."match_scores"
  alter column "player1_score" drop not null,
  alter column "player2_score" drop not null,
  add column "scorecard" jsonb;

update "public"."match_scores" ms
set "scorecard" = jsonb_build_object(
  'player1_id', m.player1_id,
  'player2_id', m.player2_id,
  'sets', jsonb_build_array(jsonb_build_array(ms.player1_score, ms.player2_score)),
  'match_winner_id', ms.winner_id
)
from "public"."matches" m
where m.id = ms.match_id
  and ms.scorecard is null;

alter table "public"."match_scores"
  alter column "scorecard" set not null;

update "public"."matches" m
set "best_of" = 1
where exists (
  select 1
  from "public"."match_scores" ms
  where ms.match_id = m.id
);

create or replace function public.validate_match_scorecard()
returns trigger
language plpgsql
as $function$
declare
  v_player1_id bigint;
  v_player2_id bigint;
  v_best_of integer;
  v_points_to_win integer;
  v_required_wins integer;
  v_sets jsonb;
  v_set jsonb;
  v_sets_len integer;
  v_index integer;
  v_p1_points integer;
  v_p2_points integer;
  v_p1_wins integer := 0;
  v_p2_wins integer := 0;
  v_declared_winner bigint;
begin
  select player1_id, player2_id, best_of, points_to_win
  into v_player1_id, v_player2_id, v_best_of, v_points_to_win
  from public.matches
  where id = new.match_id;

  if v_player1_id is null or v_player2_id is null then
    raise exception 'match_id % does not reference a valid match', new.match_id;
  end if;

  if jsonb_typeof(new.scorecard) <> 'object' then
    raise exception 'scorecard must be a JSON object';
  end if;

  if (new.scorecard ->> 'player1_id')::bigint <> v_player1_id then
    raise exception 'scorecard.player1_id must match matches.player1_id';
  end if;

  if (new.scorecard ->> 'player2_id')::bigint <> v_player2_id then
    raise exception 'scorecard.player2_id must match matches.player2_id';
  end if;

  v_declared_winner := (new.scorecard ->> 'match_winner_id')::bigint;

  if v_declared_winner not in (v_player1_id, v_player2_id) then
    raise exception 'scorecard.match_winner_id must be either player1_id or player2_id for this match';
  end if;

  v_sets := new.scorecard -> 'sets';

  if jsonb_typeof(v_sets) <> 'array' then
    raise exception 'scorecard.sets must be a JSON array';
  end if;

  v_sets_len := jsonb_array_length(v_sets);
  v_required_wins := (v_best_of / 2) + 1;

  if v_sets_len < v_required_wins then
    raise exception 'scorecard.sets must contain at least % completed games for a best-of-% match', v_required_wins, v_best_of;
  end if;

  if v_sets_len > v_best_of then
    raise exception 'scorecard.sets cannot contain more than % games for a best-of-% match', v_best_of, v_best_of;
  end if;

  for v_index in 0 .. v_sets_len - 1 loop
    v_set := v_sets -> v_index;

    if jsonb_typeof(v_set) <> 'array' or jsonb_array_length(v_set) <> 2 then
      raise exception 'each scorecard set must be a two-item array like [11, 9]';
    end if;

    v_p1_points := (v_set ->> 0)::integer;
    v_p2_points := (v_set ->> 1)::integer;

    if v_p1_points < 0 or v_p2_points < 0 then
      raise exception 'set scores must be zero or positive';
    end if;

    if v_p1_points = v_p2_points then
      raise exception 'table tennis games cannot end in a tie';
    end if;

    if greatest(v_p1_points, v_p2_points) < v_points_to_win then
      raise exception 'each game winner must reach at least % points', v_points_to_win;
    end if;

    if abs(v_p1_points - v_p2_points) < 2 then
      raise exception 'each game must be won by at least 2 points';
    end if;

    if v_p1_points > v_p2_points then
      v_p1_wins := v_p1_wins + 1;
    else
      v_p2_wins := v_p2_wins + 1;
    end if;
  end loop;

  if greatest(v_p1_wins, v_p2_wins) <> v_required_wins then
    raise exception 'completed match must end when one player reaches % game wins in a best-of-% match', v_required_wins, v_best_of;
  end if;

  if v_p1_wins = v_required_wins and v_declared_winner <> v_player1_id then
    raise exception 'scorecard.match_winner_id does not match the game-by-game winner';
  end if;

  if v_p2_wins = v_required_wins and v_declared_winner <> v_player2_id then
    raise exception 'scorecard.match_winner_id does not match the game-by-game winner';
  end if;

  new.scorecard := jsonb_build_object(
    'player1_id', v_player1_id,
    'player2_id', v_player2_id,
    'sets', v_sets,
    'match_winner_id', v_declared_winner
  );

  new.player1_score := v_p1_wins;
  new.player2_score := v_p2_wins;
  new.winner_id := v_declared_winner;

  return new;
end;
$function$;

drop trigger if exists check_match_score_winner on public.match_scores;

create trigger check_match_scorecard
before insert or update on public.match_scores
for each row execute function public.validate_match_scorecard();

comment on column public.matches.best_of is 'Match format, for example 3, 5, or 7 games. Legacy single-game rows may use 1.';
comment on column public.matches.points_to_win is 'Target points needed to win an individual game, typically 11 or 21.';
comment on column public.match_scores.scorecard is 'Canonical per-game scoring payload. player1_score/player2_score are derived game-win totals for compatibility.';
