# Spin Force Table Tennis Club

Public club website and member console for Spin Force Table Tennis Club, Kochi.

This project combines:

- a public-facing homepage for visitors
- a member login flow
- a Supabase-backed rankings view
- match submission for table tennis results
- profile and match-history views for logged-in members

## Tech Stack

- `Vite`
- `Vanilla JavaScript`
- `Supabase Auth`
- `Supabase Postgres`
- `Supabase Realtime`
- `Vercel` for deployment

## Current App Structure

The app is a lightweight single-page frontend with path-based rendering.

Routes:

- `/`
  - public website
- `/member`
  - logged-in member dashboard
- `/member/profile`
  - logged-in member profile and match history

## Features

- public homepage with club introduction, video highlights, testimonials, and contact details
- expandable member login from the header
- player rankings pulled from Supabase
- profile view for logged-in members
- table tennis match submission using multi-game scorecards
- live updates through Supabase Realtime

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create local environment file

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

Notes:

- `.env` is local only and should not be committed
- `.env.example` should contain placeholders only

### 3. Start the app

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

## Supabase Workflow

This repository tracks database changes through migration files in `supabase/migrations/`.

Important idea:

- Git stores the database definition
- Supabase stores the live database state

Typical workflow:

1. Create or edit a migration locally
2. Apply it to Supabase
3. Test the app
4. Commit the migration to Git

### Push local migrations to Supabase

```bash
supabase db push
```

### Pull remote schema changes into the repo

```bash
supabase db pull
```

## Match Data Model

The current schema supports real multi-game table tennis matches.

### `matches`

Stores match-level metadata such as:

- `player1_id`
- `player2_id`
- `match_date`
- `best_of`
- `points_to_win`

### `match_scores`

Stores the canonical score payload in `scorecard jsonb`.

Example:

```json
{
  "player1_id": 1,
  "player2_id": 2,
  "sets": [
    [11, 4],
    [11, 3],
    [3, 11],
    [2, 11],
    [3, 11]
  ],
  "match_winner_id": 2
}
```

Notes:

- `sets` contains one completed game per array item
- `best_of` should be odd, such as `3`, `5`, `7`, or `9`
- `points_to_win` is usually `11` or `21`

## Authentication Model

Supabase Auth handles login.

The app then maps the auth user to `public.profiles.auth_user_id`.

For member features to work correctly:

- the logged-in `auth.users.id` must match a row in `public.profiles.auth_user_id`

If a user can log in but sees `No linked profile found`, the profile row is not linked to that auth user yet.

## Static Assets

- logo lives in `src/assets/`
- homepage videos live in `public/videos/`

To add a new homepage video:

1. place the file in `public/videos/`
2. add it to the `showcaseVideos` array in `src/main.js`

## Deployment

This project is configured for Vercel.

Build settings:

- Build Command: `vite build`
- Output Directory: `dist`

Required Vercel environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

`vercel.json` includes an SPA rewrite so `/member` and `/member/profile` work on refresh.

## Contributor Notes

If you are contributing to this repository:

- do not commit `.env`
- do commit Supabase migrations
- keep `.env.example` safe and placeholder-only
- prefer intentional, reviewable database migrations over dashboard-only changes
- if you change the public site structure, keep member routes intact
- if you change match submission, preserve the multi-game scorecard shape

## Suggested Next Improvements

- replace placeholder testimonials with real member content and photos
- add real YouTube and Instagram links
- improve match-entry UX further by disabling unused games after the winner is decided
- add admin/member role distinctions if match control needs tighter permissions
- optimize large media assets for production
