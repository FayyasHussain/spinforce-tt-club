alter table public.skills
add column if not exists reference_videos jsonb not null default '[]'::jsonb;

alter table public.skills
drop constraint if exists skills_reference_videos_is_array;

alter table public.skills
add constraint skills_reference_videos_is_array
check (jsonb_typeof(reference_videos) = 'array');

comment on column public.skills.reference_videos is
  'JSON array of public reference videos for this skill. Expected item shape: { "title": string, "label": string, "url": string }.';

update public.skills
set reference_videos = '[
  {
    "title": "Ready position basics",
    "label": "Coach Demo",
    "url": "https://www.youtube.com/watch?v=R-aXdtGSSBE"
  },
  {
    "title": "Ready position movement",
    "label": "Footwork Link",
    "url": "https://www.youtube.com/watch?v=FrkKWan5Vy4&pp=ygUbdGFibGUgdGVubmlzIHJlYWR5IHBvc2l0aW9u"
  },
  {
    "title": "Ready position timing",
    "label": "Practice Cue",
    "url": "https://www.youtube.com/watch?v=yqPytmDA1kQ&pp=ygUbdGFibGUgdGVubmlzIHJlYWR5IHBvc2l0aW9u"
  }
]'::jsonb
where name = 'Ready position'
  and reference_videos = '[]'::jsonb;
