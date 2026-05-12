create policy "Assigned coaches can read player matches"
on public.matches
as permissive
for select
to authenticated
using (
  public.is_coach_for_player(player1_id)
  or public.is_coach_for_player(player2_id)
);

create policy "Assigned coaches can read player match scores"
on public.match_scores
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.matches m
    where m.id = match_scores.match_id
      and (
        public.is_coach_for_player(m.player1_id)
        or public.is_coach_for_player(m.player2_id)
      )
  )
);
