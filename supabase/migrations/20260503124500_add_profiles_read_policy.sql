create policy "Authenticated users can read player directory"
on "public"."profiles"
as permissive
for select
to authenticated
using (true);
