alter table public.profiles
  add column if not exists profile_photo_media_id bigint,
  add column if not exists emergency_contact_name text;

alter table public.profiles
  drop constraint if exists profiles_profile_photo_media_id_fkey,
  add constraint profiles_profile_photo_media_id_fkey
    foreign key (profile_photo_media_id) references public.media(id) on delete set null;

comment on column public.profiles.profile_photo_media_id is 'Profile photo media record. Store the image object in the member-media bucket and reference public.media(id) here.';
comment on column public.profiles.emergency_contact_name is 'Emergency contact person name for the member.';
