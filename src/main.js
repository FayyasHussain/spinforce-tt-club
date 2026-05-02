import './style.css';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

document.querySelector('#app').innerHTML = `
  <main class="container">
    <section class="hero">
      <p class="eyebrow">Spin Force Table Tennis Club</p>
      <h1>Leaderboard</h1>
      <p class="subtitle">Live player ranking from Supabase.</p>
    </section>

    <section class="card">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Skill Level</th>
            <th>Matches</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody id="leaderboard-body">
          <tr>
            <td colspan="7">Loading leaderboard...</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
`;

if (!supabaseUrl || !supabaseAnonKey) {
  document.querySelector('#leaderboard-body').innerHTML = `
    <tr>
      <td colspan="7">Missing Vite env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file.</td>
    </tr>
  `;
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function loadLeaderboard() {
  const tbody = document.querySelector('#leaderboard-body');

  const { data, error } = await supabase
    .from('player_rankings')
    .select('*')
    .order('points', { ascending: false });

  if (error) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">Error: ${error.message}</td>
      </tr>
    `;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">No ranking data found.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data
    .map((player, index) => {
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${player.name ?? ''}</td>
          <td>${player.skill_level ?? ''}</td>
          <td>${player.total_matches ?? 0}</td>
          <td>${player.wins ?? 0}</td>
          <td>${player.losses ?? 0}</td>
          <td><strong>${player.points ?? 0}</strong></td>
        </tr>
      `;
    })
    .join('');
}

loadLeaderboard();
