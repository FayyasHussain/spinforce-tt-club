alter table "public"."media"
  add column "storage_bucket" text not null default 'member-media';

create index media_storage_bucket_idx
  on public.media using btree (storage_bucket);

comment on column public.media.storage_bucket is 'Supabase Storage bucket for this media object. Member uploads currently use member-media.';

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
  and (storage.foldername(name))[1] in ('profiles', 'skills', 'matches')
  and exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.id::text = (storage.foldername(name))[2]
  )
);

create policy "Members can upload own media objects"
on storage.objects
as permissive
for insert
to authenticated
with check (
  bucket_id = 'member-media'
  and (storage.foldername(name))[1] in ('profiles', 'skills', 'matches')
  and exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.id::text = (storage.foldername(name))[2]
  )
);

create policy "Members can update own media objects"
on storage.objects
as permissive
for update
to authenticated
using (
  bucket_id = 'member-media'
  and (storage.foldername(name))[1] in ('profiles', 'skills', 'matches')
  and exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.id::text = (storage.foldername(name))[2]
  )
)
with check (
  bucket_id = 'member-media'
  and (storage.foldername(name))[1] in ('profiles', 'skills', 'matches')
  and exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.id::text = (storage.foldername(name))[2]
  )
);

create policy "Members can delete own media objects"
on storage.objects
as permissive
for delete
to authenticated
using (
  bucket_id = 'member-media'
  and (storage.foldername(name))[1] in ('profiles', 'skills', 'matches')
  and exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.id::text = (storage.foldername(name))[2]
  )
);
