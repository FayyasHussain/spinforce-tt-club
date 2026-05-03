create policy "Users can create own matches"
on "public"."matches"
as permissive
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and (p.id = matches.player1_id or p.id = matches.player2_id)
  )
);
