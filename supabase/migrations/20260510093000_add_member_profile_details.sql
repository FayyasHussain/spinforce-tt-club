do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_gender') then
    create type public.profile_gender as enum (
      'male',
      'female',
      'cannot_disclose'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'membership_type') then
    create type public.membership_type as enum (
      'hourly_play',
      'coaching',
      'player_membership',
      'trial'
    );
  end if;
end
$$;

alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists gender public.profile_gender,
  add column if not exists joining_date date,
  add column if not exists membership_type public.membership_type,
  add column if not exists profile_photo_media_id bigint,
  add column if not exists parent_guardian_name text,
  add column if not exists emergency_contact text,
  add column if not exists notes text;

alter table public.profiles
  drop constraint if exists profiles_profile_photo_media_id_fkey,
  add constraint profiles_profile_photo_media_id_fkey
    foreign key (profile_photo_media_id) references public.media(id) on delete set null;

comment on column public.profiles.date_of_birth is 'Member date of birth.';
comment on column public.profiles.gender is 'Member gender preference.';
comment on column public.profiles.joining_date is 'Date the member joined the club.';
comment on column public.profiles.membership_type is 'Current membership category for the member.';
comment on column public.profiles.profile_photo_media_id is 'Profile photo media record. Store the image object in the member-media bucket and reference public.media(id) here.';
comment on column public.profiles.parent_guardian_name is 'Parent or guardian name, useful for junior members.';
comment on column public.profiles.emergency_contact is 'Emergency contact details for the member.';
comment on column public.profiles.notes is 'Generic admin notes about the member.';
