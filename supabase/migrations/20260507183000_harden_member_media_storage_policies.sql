create or replace function public.user_owns_member_media_path(object_name text)
returns boolean
language sql
security definer
set search_path = public, storage
as $$
  select exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and (
        (
          (storage.foldername(object_name))[1] in ('profiles', 'skills', 'matches')
          and p.id::text = (storage.foldername(object_name))[2]
        )
        or (
          (storage.foldername(object_name))[2] in ('profiles', 'skills', 'matches')
          and p.id::text = (storage.foldername(object_name))[3]
        )
      )
  );
$$;

grant execute on function public.user_owns_member_media_path(text) to authenticated;

drop policy if exists "Members can read own media objects" on storage.objects;
drop policy if exists "Members can upload own media objects" on storage.objects;
drop policy if exists "Members can update own media objects" on storage.objects;
drop policy if exists "Members can delete own media objects" on storage.objects;

create policy "Members can read own media objects"
on storage.objects
as permissive
for select
to authenticated
using (
  bucket_id = 'member-media'
  and public.user_owns_member_media_path(name)
);

create policy "Members can upload own media objects"
on storage.objects
as permissive
for insert
to authenticated
with check (
  bucket_id = 'member-media'
  and public.user_owns_member_media_path(name)
);

create policy "Members can update own media objects"
on storage.objects
as permissive
for update
to authenticated
using (
  bucket_id = 'member-media'
  and public.user_owns_member_media_path(name)
)
with check (
  bucket_id = 'member-media'
  and public.user_owns_member_media_path(name)
);

create policy "Members can delete own media objects"
on storage.objects
as permissive
for delete
to authenticated
using (
  bucket_id = 'member-media'
  and public.user_owns_member_media_path(name)
);
