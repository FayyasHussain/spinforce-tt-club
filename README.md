# Spin Force Table Tennis Club

Public website and member console for Spin Force Table Tennis Club, Kochi.

The app supports the public club website, member login, player rankings, match submission, member profiles, skill ladder progress, coach review flows, admin review flows, and PostHog analytics.

## Tech Stack

- `Vite`
- `React`
- `React Router`
- `Supabase Auth`
- `Supabase Postgres`
- `Supabase Realtime`
- `Supabase Storage`
- `PostHog`
- `Vercel`

## App Routes

- `/` - public club website
- `/member` - member dashboard
- `/member/profile` - member profile and match history
- `/member/profile/settings` - account and access settings
- `/member/matches` - match submission and match history
- `/member/skills` - skill ladder progress and media
- `/member/rankings` - club rankings
- `/member/admin` - admin player review
- `/member/coaching` - coach player review

## Features

- public homepage with club intro, video highlights, testimonials, contact links, WhatsApp link, and map link
- Supabase Auth login for members
- member dashboard with rankings, match history, and skill progress summaries
- table tennis match submission with multi-game scorecards
- profile view and profile edit fields
- skill ladder categories, progress, comments, and media uploads
- admin player profile and history review
- coach view for assigned players
- live ranking/history refresh through Supabase Realtime
- PostHog page views, autocaptured clicks, auth events, user identity, web vitals, and match-save events

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create local environment file

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_POSTHOG_KEY=phc_your_project_token
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_POSTHOG_ENABLE_SESSION_REPLAY=false
```

Notes:

- `.env` is local only and must not be committed.
- `VITE_POSTHOG_KEY` is the PostHog project token, not a personal API key.
- `VITE_POSTHOG_ENABLE_SESSION_REPLAY=false` is the recommended default so recordings do not consume the free tier too quickly.

### 3. Start the app

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

### 5. Preview production build

```bash
npm run preview
```

## Analytics

PostHog is initialized in `src/lib/analytics.js` and used from the React app.

Configured tracking:

- `$pageview` on route changes
- PostHog autocapture for frontend interactions
- PostHog web vitals, controlled in PostHog project settings
- `identify` for logged-in Supabase users
- `login_success`
- `login_failed`
- `logout_success`
- `match_saved`

`match_saved` is captured in `src/components/MatchForm.jsx` after Supabase successfully saves a match. It sends:

```js
{
  best_of,
  points_to_win,
  set_count,
  won_by_current_user
}
```

Avoid sending private member data such as phone numbers, emails, addresses, or names in analytics event properties.

## Supabase Workflow

Database changes are tracked through migration files in `supabase/migrations/`.

Typical workflow:

1. Create or edit a migration locally.
2. Apply it to Supabase.
3. Test the app.
4. Commit the migration to Git.

Push local migrations to Supabase:

```bash
supabase db push
```

Pull remote schema changes into the repo:

```bash
supabase db pull
```

## Auth And Roles

Supabase Auth handles login. The app maps `auth.users.id` to `public.profiles.auth_user_id`.

Member features require:

- a valid Supabase auth session
- a matching row in `public.profiles`
- the profile row linked through `auth_user_id`

Role-based areas depend on profile roles:

- `admin` unlocks `/member/admin`
- `coach` unlocks `/member/coaching`

If a user can log in but sees `No linked profile found`, the profile row is not linked to that auth user yet.

## Match Data Model

The schema supports multi-game table tennis matches.

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

- `sets` contains one completed game per array item.
- `best_of` should be odd, such as `1`, `3`, `5`, `7`, or `9`.
- `points_to_win` is usually `11` or `21`.

## Static Content And Assets

Main public-site content lives in:

- `src/data/siteContent.js`

Image assets live in:

- `src/assets/`

Public videos live in:

- `public/videos/`

To add a homepage video:

1. Place the file in `public/videos/`.
2. Add it to the `showcaseVideos` array in `src/data/siteContent.js`.

## Deployment

This project is configured for Vercel.

Build settings:

- Build Command: `npm run build`
- Output Directory: `dist`

Required Vercel environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST`
- `VITE_POSTHOG_ENABLE_SESSION_REPLAY`

`vercel.json` includes an SPA rewrite so nested React routes work on refresh.

Production domain:

- `https://spinforcett.space`

## Contributor Notes

- Do not commit `.env`.
- Do commit Supabase migrations.
- Keep environment examples placeholder-only.
- Prefer intentional, reviewable database migrations over dashboard-only changes.
- If you change the public site structure, keep member routes intact.
- If you change match submission, preserve the multi-game scorecard shape.
- Do not send private member details to PostHog.
- Run `npm run build` before merging.

## Useful Files

- `src/App.jsx` - top-level routes, auth state, data refresh, analytics hooks
- `src/lib/supabase.js` - Supabase client setup
- `src/lib/analytics.js` - PostHog wrapper
- `src/components/MatchForm.jsx` - match submission and `match_saved` event
- `src/data/siteContent.js` - public website copy, links, testimonials, and videos
- `supabase/migrations/` - database schema migrations
