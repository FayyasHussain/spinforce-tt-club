import './style.css';
import { createClient } from '@supabase/supabase-js';
import spinforceLogo from './assets/spinforce-logo.png';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

document.querySelector('#app').innerHTML = `
  <main class="container">
    <div id="app-shell"></div>
  </main>
`;

const shell = document.querySelector('#app-shell');

if (!supabaseUrl || !supabaseAnonKey) {
  shell.innerHTML = `
    <section class="card panel">
      <p class="message error">Missing Vite env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file.</p>
    </section>
  `;
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const mapUrl = 'https://maps.app.goo.gl/RCTrdf86nwH3vi638';
const venueAddress = 'Beats Square, Anakuzhiyil Building, Kottaythupura, Thiruvankulam, Ernakulam, Kerala 682305';
const contactNumber = '+91 90303 58968';
const instagramUrl = 'https://instagram.com/';
const youtubeUrl = 'https://youtube.com/';

// Add public promo videos here later, for example:
// { src: '/videos/spinforce-1.mp4', title: 'Club Rally Night' }
const showcaseVideos = [
  {
    src: '/videos/WhatsApp%20Video%202026-04-30%20at%2011.30.34%20AM.mp4',
    title: 'Spin Force Club Highlight',
    caption: 'Homepage showcase reel from the club floor.',
  },
  {
    src: '/videos/videoPaid.mp4',
    title: 'Spin Force Training Session',
    caption: 'Additional club highlight now included in the homepage carousel.',
  },
];

const testimonials = [
  {
    image: spinforceLogo,
    name: 'Arjun Nair',
    role: 'Club Member',
    quote: 'Spin Force gave me a proper training environment, strong matchplay, and a club community that keeps me improving every week.',
  },
  {
    image: spinforceLogo,
    name: 'Meera Joseph',
    role: 'Parent',
    quote: 'The coaching is disciplined and welcoming. My child feels challenged, supported, and excited to come back for every session.',
  },
  {
    image: spinforceLogo,
    name: 'Rahul Thomas',
    role: 'League Player',
    quote: 'If you want serious table tennis in Kochi, this is the kind of setup you look for: good structure, competition, and people who care about the sport.',
  },
];

const state = {
  session: null,
  showLogin: false,
  profile: null,
  players: [],
  leaderboard: [],
  history: [],
  loadingLeaderboard: true,
  loadingAuthData: false,
  loadingHistory: false,
  authMessage: '',
  authError: '',
  submitMessage: '',
  submitError: '',
  activeVideoIndex: 0,
  matchForm: {
    opponentId: '',
    bestOf: 5,
    pointsToWin: 11,
    sets: Array.from({ length: 5 }, () => ({ winner: '', loserScore: '' })),
  },
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function setState(patch) {
  Object.assign(state, patch);
  render();
}

function normaliseMatchForm(nextConfig = {}) {
  const opponentId = String(nextConfig.opponentId ?? state.matchForm.opponentId ?? '');
  const bestOf = Number(nextConfig.bestOf ?? state.matchForm.bestOf ?? 5);
  const pointsToWin = Number(nextConfig.pointsToWin ?? state.matchForm.pointsToWin ?? 11);
  const previousSets = nextConfig.sets ?? state.matchForm.sets ?? [];
  const safeBestOf = Number.isInteger(bestOf) && bestOf >= 3 && bestOf % 2 === 1 ? bestOf : 5;
  const safePoints = pointsToWin === 21 ? 21 : 11;
  const sets = Array.from({ length: safeBestOf }, (_, index) => {
    return previousSets[index] ?? { winner: '', loserScore: '' };
  });

  return {
    opponentId,
    bestOf: safeBestOf,
    pointsToWin: safePoints,
    sets,
  };
}

function getPathname() {
  return window.location.pathname || '/';
}

function getRoute() {
  const pathname = getPathname();

  if (pathname === '/member/profile') {
    return { area: 'member', view: 'profile' };
  }

  if (pathname === '/member') {
    return { area: 'member', view: 'home' };
  }

  return { area: 'public', view: 'home' };
}

function navigateTo(path) {
  if (getPathname() === path) {
    return;
  }

  window.history.pushState({}, '', path);
  render();

  if (path === '/member/profile') {
    void loadHistory();
  }
}

function render() {
  const route = getRoute();

  if (route.area === 'member') {
    shell.innerHTML = state.session ? renderConsoleApp(route.view) : renderMemberGate();
  } else {
    shell.innerHTML = renderPublicLanding();
  }

  bindEvents();
  syncCarouselPlayback();
}

function renderPublicLanding() {
  return `
    <section class="landing">
      <header class="site-header card">
        <div class="site-header-inner">
          <a class="brand-lockup" href="#top">
            <img class="site-logo" src="${spinforceLogo}" alt="Spin Force Table Tennis Club logo" />
            <div class="brand-copy">
              <strong>Spin Force</strong>
              <span>Table Tennis Club, Kochi</span>
            </div>
          </a>
          <nav class="site-nav" aria-label="Primary">
            <a href="#about">About</a>
            <a href="#highlights">Highlights</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#contact">Contact</a>
          </nav>
          <div class="member-login">
            ${state.session
              ? `<button id="go-member-button" class="button member-login-button" type="button">Open Member Area</button>`
              : `<button id="show-login-button" class="button member-login-button" type="button">${state.showLogin ? 'Close Login' : 'Member Login'}</button>`}
          </div>
        </div>
        ${state.showLogin ? renderPublicLoginCard() : ''}
      </header>

      <section id="top" class="hero-home card">
        <div class="hero-home-copy">
          <p class="eyebrow">Spin Force Table Tennis Club</p>
          <h1>Welcome to Spin Force Table Tennis Club, Kochi</h1>
          <p class="hero-lead">A focused club environment for training, competitive matchplay, skill development, and a strong local table tennis community.</p>
          <div class="hero-actions">
            <a class="button" href="${mapUrl}" target="_blank" rel="noreferrer">Get Directions</a>
            <a class="button button-secondary" href="#about">Explore The Club</a>
          </div>
        </div>
        <div class="hero-home-mark">
          <img class="hero-mark-logo" src="${spinforceLogo}" alt="Spin Force crest" />
        </div>
      </section>

      <section id="about" class="story-grid">
        <section class="card panel story-card">
          <div class="card-header">
            <div>
              <h2>Welcome To The Club</h2>
              <p class="muted">This section should feel like a proper introduction, not a product screen.</p>
            </div>
          </div>
          <p class="body-copy">Spin Force Table Tennis Club is built for players who want more than occasional casual games. We care about coaching quality, competitive repetition, disciplined improvement, and a club environment where players at different levels can grow.</p>
          <p class="body-copy">Whether someone is stepping in as a beginner, returning to the sport, or training consistently for stronger match results, the goal is the same: give them a place where table tennis is taken seriously and enjoyed deeply.</p>
          <div class="feature-grid">
            <article class="feature-tile">
              <strong>Coaching</strong>
              <p>Structured sessions focused on technique, consistency, and match awareness.</p>
            </article>
            <article class="feature-tile">
              <strong>Competition</strong>
              <p>Real matchplay, club rankings, and a rhythm of improvement through play.</p>
            </article>
            <article class="feature-tile">
              <strong>Community</strong>
              <p>A serious but welcoming club culture for players and families in Kochi.</p>
            </article>
          </div>
        </section>

        <section class="card panel venue-card">
          <div class="card-header">
            <div>
              <h2>Visit Spin Force</h2>
              <p class="muted">Make the location and access details obvious for first-time visitors.</p>
            </div>
          </div>
          <dl class="details">
            <div>
              <dt>Location</dt>
              <dd>Kochi, Kerala</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>${escapeHtml(venueAddress)}</dd>
            </div>
            <div>
              <dt>Maps</dt>
              <dd><a class="inline-link" href="${mapUrl}" target="_blank" rel="noreferrer">Open club location in Google Maps</a></dd>
            </div>
          </dl>
        </section>
      </section>

      <section id="highlights" class="card carousel-card">
        <div class="section-intro panel-heading">
          <div class="card-header panel-heading">
            <div>
              <h2>Club Highlights</h2>
              <p class="muted">Training clips, club moments, and match energy should live here. Videos play one after another automatically.</p>
            </div>
          </div>
        </div>
        ${renderVideoCarousel()}
      </section>

      <section id="testimonials" class="testimonials-block">
        <div class="section-heading">
          <p class="eyebrow dark">Member Voices</p>
          <h2>What People Say About Spin Force</h2>
          <p class="muted">These are placeholder testimonials for now. Replace them with real member photos and quotes when ready.</p>
        </div>
        <div class="testimonial-grid">
          ${testimonials.map((item) => `
            <article class="card testimonial-card">
              <img class="testimonial-avatar" src="${item.image}" alt="${escapeHtml(item.name)}" />
              <div class="testimonial-copy">
                <p class="testimonial-quote">“${escapeHtml(item.quote)}”</p>
                <strong>${escapeHtml(item.name)}</strong>
                <span>${escapeHtml(item.role)}</span>
              </div>
            </article>
          `).join('')}
        </div>
      </section>

      <footer id="contact" class="footer card panel">
        <div class="footer-block">
          <h2>Contact</h2>
          <p><a class="inline-link" href="tel:+919030358968">${contactNumber}</a></p>
        </div>
        <div class="footer-block">
          <h2>About</h2>
          <p>Spin Force is a Kochi-based table tennis club focused on training, matchplay, rankings, and a strong playing culture.</p>
        </div>
        <div class="footer-block">
          <h2>Address</h2>
          <p>${escapeHtml(venueAddress)}</p>
          <p><a class="inline-link" href="${mapUrl}" target="_blank" rel="noreferrer">View on Google Maps</a></p>
        </div>
        <div class="footer-block">
          <h2>Follow</h2>
          <p><a class="inline-link" href="${youtubeUrl}" target="_blank" rel="noreferrer">YouTube Channel</a></p>
          <p><a class="inline-link" href="${instagramUrl}" target="_blank" rel="noreferrer">Instagram Page</a></p>
        </div>
      </footer>
    </section>
  `;
}

function renderVideoCarousel() {
  if (!showcaseVideos.length) {
    return `
      <div class="carousel-empty">
        <p class="message">No showcase videos added yet.</p>
        <p class="muted">Add files in <code>public/videos/</code> and list them in <code>showcaseVideos</code> inside <code>src/main.js</code>.</p>
      </div>
    `;
  }

  const currentVideo = showcaseVideos[state.activeVideoIndex] ?? showcaseVideos[0];
  const indicators = showcaseVideos
    .map((video, index) => {
      return `
        <button
          class="carousel-dot ${index === state.activeVideoIndex ? 'active' : ''}"
          type="button"
          data-video-index="${index}"
          aria-label="Show ${escapeHtml(video.title)}"
        ></button>
      `;
    })
    .join('');

  return `
    <div class="carousel-shell">
      <div class="carousel-frame">
        <video
          id="showcase-video"
          class="showcase-video"
          src="${escapeHtml(currentVideo.src)}"
          poster="${escapeHtml(currentVideo.poster ?? '')}"
          muted
          playsinline
          controls
          autoplay
        ></video>
      </div>
      <div class="carousel-meta">
        <strong>${escapeHtml(currentVideo.title)}</strong>
        ${currentVideo.caption ? `<p class="muted">${escapeHtml(currentVideo.caption)}</p>` : ''}
      </div>
      <div class="carousel-controls">
        <button id="prev-video-button" class="button button-secondary" type="button">Previous</button>
        <div class="carousel-dots">${indicators}</div>
        <button id="next-video-button" class="button button-secondary" type="button">Next</button>
      </div>
    </div>
  `;
}

function renderPublicLoginCard() {
  return `
    <div class="header-login-panel">
      <form id="login-form" class="header-login-form">
        <label class="field compact-field">
          <span>Email</span>
          <input id="email" name="email" type="email" autocomplete="email" required />
        </label>
        <label class="field compact-field">
          <span>Password</span>
          <input id="password" name="password" type="password" autocomplete="current-password" required />
        </label>
        <button class="button" type="submit">Sign in</button>
      </form>
      ${state.authError ? `<p class="message error">${escapeHtml(state.authError)}</p>` : ''}
      ${state.authMessage ? `<p class="message success">${escapeHtml(state.authMessage)}</p>` : ''}
    </div>
  `;
}

function renderMemberGate() {
  return `
    <section class="member-gate card panel">
      <div class="card-header">
        <div>
          <p class="eyebrow dark">Members</p>
          <h2>Member Login Required</h2>
          <p class="muted">This area is available only to signed-in members. Log in to access rankings tools, your profile, and match submission.</p>
        </div>
      </div>
      <div class="hero-actions">
        <button id="member-gate-login" class="button" type="button">Open Login</button>
        <button id="member-gate-home" class="button button-secondary" type="button">Back To Homepage</button>
      </div>
      ${state.showLogin ? renderPublicLoginCard() : ''}
    </section>
  `;
}

function renderConsoleApp(activeView) {
  return `
    <section class="layout">
      <div class="stack">
        ${renderAuthCard()}
        ${renderNavigationCard(activeView)}
        ${activeView === 'home' ? renderMatchCard() : ''}
      </div>
      ${activeView === 'home' ? renderHomeView() : renderProfileView()}
    </section>
  `;
}

function renderAuthCard() {
  const email = escapeHtml(state.session?.user?.email ?? '');
  const profileName = escapeHtml(state.profile?.name ?? '');

  return `
    <section class="card panel">
      <div class="card-header">
        <div>
          <h2>Account</h2>
          <p class="muted">Supabase Auth identifies the user. The app then looks up the linked row in <code>profiles</code>.</p>
        </div>
      </div>
      <dl class="details">
        <div>
          <dt>Email</dt>
          <dd>${email}</dd>
        </div>
        <div>
          <dt>Player Profile</dt>
          <dd>${profileName || 'No linked profile found'}</dd>
        </div>
      </dl>
      ${state.authError ? `<p class="message error">${escapeHtml(state.authError)}</p>` : ''}
      ${state.authMessage ? `<p class="message success">${escapeHtml(state.authMessage)}</p>` : ''}
      <button id="logout-button" class="button button-secondary" type="button">Log out</button>
    </section>
  `;
}

function renderNavigationCard(activeView) {
  return `
    <section class="card panel">
      <div class="card-header">
        <div>
          <h2>Views</h2>
          <p class="muted">Home keeps the rankings and match form. Profile shows your player record and your own match history.</p>
        </div>
      </div>
      <div class="nav-list">
        <button id="view-home" class="nav-button ${activeView === 'home' ? 'active' : ''}" type="button">Home</button>
        <button id="view-profile" class="nav-button ${activeView === 'profile' ? 'active' : ''}" type="button">Profile</button>
        <button id="view-public-home" class="nav-button" type="button">Public Homepage</button>
      </div>
    </section>
  `;
}

function renderMatchCard() {
  if (state.loadingAuthData) {
    return `
      <section class="card panel">
        <div class="card-header">
          <div>
            <h2>Submit Match</h2>
            <p class="muted">Loading your player profile and the opponent list.</p>
          </div>
        </div>
      </section>
    `;
  }

  if (!state.profile) {
    return `
      <section class="card panel">
        <div class="card-header">
          <div>
            <h2>Submit Match</h2>
            <p class="muted">Your auth user is not linked to a row in <code>profiles</code>. The app needs that row to know your player id.</p>
          </div>
        </div>
      </section>
    `;
  }

  const options = state.players
    .filter((player) => player.id !== state.profile.id)
    .map((player) => {
      return `<option value="${player.id}" ${String(player.id) === state.matchForm.opponentId ? 'selected' : ''}>${escapeHtml(player.name)}${player.skill_level ? ` (${escapeHtml(player.skill_level)})` : ''}</option>`;
    })
    .join('');

  const selectedOpponent = state.players.find((player) => String(player.id) === state.matchForm.opponentId);
  const opponentLabel = selectedOpponent?.name ?? 'Opponent Profile';

  const bestOfOptions = [3, 5, 7, 9]
    .map((value) => `<option value="${value}" ${value === state.matchForm.bestOf ? 'selected' : ''}>Best of ${value}</option>`)
    .join('');

  const pointOptions = [11, 21]
    .map((value) => `<option value="${value}" ${value === state.matchForm.pointsToWin ? 'selected' : ''}>${value} point game</option>`)
    .join('');

  return `
    <section class="card panel">
      <div class="card-header">
        <div>
          <h2>Submit Match</h2>
          <p class="muted">Configure the match format first, then enter each game score. The app builds the scorecard JSON required by the Supabase schema.</p>
        </div>
      </div>
      <form id="match-form" class="form">
        <label class="field">
          <span>Your Profile</span>
          <input type="text" value="${escapeHtml(state.profile.name)}" disabled />
        </label>
        <label class="field">
          <span>Opponent</span>
          <select id="opponent-id" name="opponentId" required>
            <option value="">Select opponent</option>
            ${options}
          </select>
        </label>
        <div class="field-grid">
          <label class="field">
            <span>Match Format</span>
            <select id="best-of" name="bestOf">${bestOfOptions}</select>
          </label>
          <label class="field">
            <span>Points To Win</span>
            <select id="points-to-win" name="pointsToWin">${pointOptions}</select>
          </label>
        </div>
        <div id="sets-editor" class="sets-editor">
          ${renderSetInputs({
            bestOf: state.matchForm.bestOf,
            pointsToWin: state.matchForm.pointsToWin,
            yourName: state.profile.name,
            opponentLabel,
            sets: state.matchForm.sets,
          })}
        </div>
        ${state.submitError ? `<p class="message error">${escapeHtml(state.submitError)}</p>` : ''}
        ${state.submitMessage ? `<p class="message success">${escapeHtml(state.submitMessage)}</p>` : ''}
        <button class="button" type="submit">Save Match</button>
      </form>
    </section>
  `;
}

function renderSetInputs({ bestOf, pointsToWin, yourName, opponentLabel, sets }) {
  const losingScoreOptions = Array.from(
    { length: pointsToWin === 21 ? 20 : 10 },
    (_, score) => `<option value="${score}">${score}</option>`,
  ).join('');

  return Array.from({ length: bestOf }, (_, index) => {
    const gameNumber = index + 1;
    const setState = sets[index] ?? { winner: '', loserScore: '' };
    const winner = setState.winner ?? '';
    const loserScore = setState.loserScore ?? '';
    const player1Score = winner === 'player1' ? pointsToWin : loserScore;
    const player2Score = winner === 'player2' ? pointsToWin : loserScore;
    return `
      <div class="set-row">
        <strong>Game ${gameNumber}</strong>
        <div class="field-grid">
          <label class="field">
            <span>Winner</span>
            <select name="set-${gameNumber}-winner" data-set-index="${index}" data-field="winner">
              <option value="">Select winner</option>
              <option value="player1" ${winner === 'player1' ? 'selected' : ''}>${escapeHtml(yourName)}</option>
              <option value="player2" ${winner === 'player2' ? 'selected' : ''}>${escapeHtml(opponentLabel)}</option>
            </select>
          </label>
          <label class="field">
            <span>Losing Score</span>
            <select name="set-${gameNumber}-loserScore" data-set-index="${index}" data-field="loserScore" ${winner ? '' : 'disabled'}>
              <option value="">Select score</option>
              ${losingScoreOptions.replace(
                `value="${loserScore}"`,
                `value="${loserScore}" selected`,
              )}
            </select>
          </label>
        </div>
        <div class="set-preview">
          <span>${escapeHtml(yourName)}: <strong>${player1Score === '' ? '-' : player1Score}</strong></span>
          <span>${escapeHtml(opponentLabel)}: <strong>${player2Score === '' ? '-' : player2Score}</strong></span>
          <span class="muted">Winner auto-gets ${pointsToWin}. Losing score stays within normal regulation scoring.</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderHomeView() {
  return `
    <section class="card">
      <div class="card-header panel-heading">
        <div>
          <h2>Rankings</h2>
          <p class="muted">This stays driven by the derived <code>player_rankings</code> view, so match inserts automatically affect this page.</p>
        </div>
      </div>
      ${renderLeaderboardTable()}
    </section>
  `;
}

function renderProfileView() {
  if (state.loadingAuthData) {
    return `
      <section class="card panel">
        <div class="card-header">
          <div>
            <h2>Profile</h2>
            <p class="muted">Loading your player record.</p>
          </div>
        </div>
      </section>
    `;
  }

  if (!state.profile) {
    return `
      <section class="card panel">
        <div class="card-header">
          <div>
            <h2>Profile</h2>
            <p class="muted">No linked player profile was found for this account.</p>
          </div>
        </div>
      </section>
    `;
  }

  return `
    <section class="stack">
      <section class="card panel">
        <div class="card-header">
          <div>
            <h2>Profile</h2>
            <p class="muted">These fields come from your row in <code>public.profiles</code>.</p>
          </div>
        </div>
        <dl class="details">
          <div>
            <dt>Name</dt>
            <dd>${escapeHtml(state.profile.name)}</dd>
          </div>
          <div>
            <dt>Mobile</dt>
            <dd>${escapeHtml(state.profile.mobile ?? '')}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>${escapeHtml(state.profile.address ?? '')}</dd>
          </div>
          <div>
            <dt>Skill Level</dt>
            <dd>${escapeHtml(state.profile.skill_level ?? '')}</dd>
          </div>
        </dl>
      </section>

      <section class="card">
        <div class="card-header panel-heading">
          <div>
            <h2>Match History</h2>
            <p class="muted">This queries only the logged-in player's matches, ordered by newest first.</p>
          </div>
        </div>
        ${renderHistoryTable()}
      </section>
    </section>
  `;
}

function renderLeaderboardTable() {
  if (state.loadingLeaderboard) {
    return `
      <table>
        <tbody>
          <tr>
            <td colspan="7">Loading leaderboard...</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  if (!state.leaderboard.length) {
    return `
      <table>
        <tbody>
          <tr>
            <td colspan="7">No ranking data found.</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  const rows = state.leaderboard
    .map((player, index) => {
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(player.name)}</td>
          <td>${escapeHtml(player.skill_level ?? '')}</td>
          <td>${player.total_matches ?? 0}</td>
          <td>${player.wins ?? 0}</td>
          <td>${player.losses ?? 0}</td>
          <td><strong>${player.points ?? 0}</strong></td>
        </tr>
      `;
    })
    .join('');

  return `
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
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderHistoryTable() {
  if (state.loadingHistory) {
    return `
      <table>
        <tbody>
          <tr>
            <td colspan="4">Loading match history...</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  if (!state.history.length) {
    return `
      <table>
        <tbody>
          <tr>
            <td colspan="4">No matches found for this player.</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  const rows = state.history
    .map((match) => {
      const rankingBadge = match.opponentRank
        ? `<span class="rank-pill">Current Rank #${match.opponentRank}</span>`
        : `<span class="rank-pill rank-pill-muted">Rank unavailable</span>`;
      return `
        <tr>
          <td>
            <div class="opponent-cell">
              <strong>${escapeHtml(match.opponentName)}</strong>
              ${rankingBadge}
            </div>
          </td>
          <td><span class="status-pill ${match.result.toLowerCase()}">${escapeHtml(match.result)}</span></td>
          <td>
            <div class="score-cell">
              <strong>${escapeHtml(match.score)}</strong>
              <span>${escapeHtml(match.formatSummary)}</span>
              <span>${escapeHtml(match.setSummary)}</span>
            </div>
          </td>
          <td>${escapeHtml(formatDate(match.matchDate))}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table>
      <thead>
        <tr>
          <th>Opponent</th>
          <th>Status</th>
          <th>Score</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function bindEvents() {
  const loginForm = document.querySelector('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const showLoginButton = document.querySelector('#show-login-button');
  if (showLoginButton) {
    showLoginButton.addEventListener('click', () => {
      setState({
        showLogin: !state.showLogin,
        authError: '',
        authMessage: '',
      });
    });
  }

  const goMemberButton = document.querySelector('#go-member-button');
  if (goMemberButton) {
    goMemberButton.addEventListener('click', () => navigateTo('/member'));
  }

  const memberGateLogin = document.querySelector('#member-gate-login');
  if (memberGateLogin) {
    memberGateLogin.addEventListener('click', () => {
      setState({
        showLogin: !state.showLogin,
        authError: '',
        authMessage: '',
      });
    });
  }

  const memberGateHome = document.querySelector('#member-gate-home');
  if (memberGateHome) {
    memberGateHome.addEventListener('click', () => navigateTo('/'));
  }

  const logoutButton = document.querySelector('#logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }

  const matchForm = document.querySelector('#match-form');
  if (matchForm) {
    matchForm.addEventListener('submit', handleMatchSubmit);
  }

  const bestOfField = document.querySelector('#best-of');
  if (bestOfField) {
    bestOfField.addEventListener('change', handleMatchConfigChange);
  }

  const opponentField = document.querySelector('#opponent-id');
  if (opponentField) {
    opponentField.addEventListener('change', handleOpponentChange);
  }

  const pointsField = document.querySelector('#points-to-win');
  if (pointsField) {
    pointsField.addEventListener('change', handleMatchConfigChange);
  }

  document.querySelectorAll('[data-set-index][data-field]').forEach((field) => {
    field.addEventListener('change', handleSetFieldChange);
  });

  const homeButton = document.querySelector('#view-home');
  if (homeButton) {
    homeButton.addEventListener('click', () => navigateTo('/member'));
  }

  const profileButton = document.querySelector('#view-profile');
  if (profileButton) {
    profileButton.addEventListener('click', () => navigateTo('/member/profile'));
  }

  const publicHomeButton = document.querySelector('#view-public-home');
  if (publicHomeButton) {
    publicHomeButton.addEventListener('click', () => navigateTo('/'));
  }

  const prevVideoButton = document.querySelector('#prev-video-button');
  if (prevVideoButton) {
    prevVideoButton.addEventListener('click', showPreviousVideo);
  }

  const nextVideoButton = document.querySelector('#next-video-button');
  if (nextVideoButton) {
    nextVideoButton.addEventListener('click', showNextVideo);
  }

  document.querySelectorAll('[data-video-index]').forEach((button) => {
    button.addEventListener('click', () => {
      setState({ activeVideoIndex: Number(button.dataset.videoIndex) });
    });
  });

  const video = document.querySelector('#showcase-video');
  if (video) {
    video.addEventListener('ended', showNextVideo);
  }
}

function showPreviousVideo() {
  if (!showcaseVideos.length) {
    return;
  }

  const nextIndex = (state.activeVideoIndex - 1 + showcaseVideos.length) % showcaseVideos.length;
  setState({ activeVideoIndex: nextIndex });
}

function showNextVideo() {
  if (!showcaseVideos.length) {
    return;
  }

  const nextIndex = (state.activeVideoIndex + 1) % showcaseVideos.length;
  setState({ activeVideoIndex: nextIndex });
}

function syncCarouselPlayback() {
  const video = document.querySelector('#showcase-video');
  if (!video) {
    return;
  }

  video.currentTime = 0;
  video.play().catch(() => {});
}

async function handleLogin(event) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  setState({
    authError: '',
    authMessage: 'Signing in...',
  });

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    setState({
      authError: error.message,
      authMessage: '',
    });
    return;
  }

  setState({
    authError: '',
    authMessage: 'Signed in successfully.',
    showLogin: false,
  });
}

async function handleLogout() {
  setState({
    authError: '',
    authMessage: 'Signing out...',
  });

  const { error } = await supabase.auth.signOut();

  if (error) {
    setState({
      authError: error.message,
      authMessage: '',
    });
    return;
  }

  setState({
    showLogin: false,
    authError: '',
    authMessage: 'Signed out.',
    submitError: '',
    submitMessage: '',
    history: [],
  });

  navigateTo('/');
}

async function handleMatchSubmit(event) {
  event.preventDefault();

  if (!state.profile) {
    setState({
      submitError: 'No linked player profile found for this user.',
      submitMessage: '',
    });
    return;
  }

  const opponentId = Number(state.matchForm.opponentId);
  const bestOf = state.matchForm.bestOf;
  const pointsToWin = state.matchForm.pointsToWin;

  if (!opponentId) {
    setState({
      submitError: 'Select an opponent.',
      submitMessage: '',
    });
    return;
  }

  if (!Number.isInteger(bestOf) || bestOf < 3 || bestOf % 2 === 0) {
    setState({
      submitError: 'Best of must be an odd number like 3, 5, 7, or 9.',
      submitMessage: '',
    });
    return;
  }

  if (!Number.isInteger(pointsToWin) || pointsToWin <= 0) {
    setState({
      submitError: 'Points to win must be a positive whole number.',
      submitMessage: '',
    });
    return;
  }

  const requiredWins = Math.floor(bestOf / 2) + 1;
  const sets = [];
  let player1Wins = 0;
  let player2Wins = 0;

  for (let gameNumber = 1; gameNumber <= bestOf; gameNumber += 1) {
    const setEntry = state.matchForm.sets[gameNumber - 1] ?? { winner: '', loserScore: '' };
    const winner = setEntry.winner;
    const loserScoreRaw = setEntry.loserScore;

    if (!winner && loserScoreRaw === '') {
      continue;
    }

    if (!winner) {
      setState({
        submitError: `Game ${gameNumber} needs a selected winner.`,
        submitMessage: '',
      });
      return;
    }

    if (loserScoreRaw === '') {
      setState({
        submitError: `Game ${gameNumber} needs a losing score selection.`,
        submitMessage: '',
      });
      return;
    }

    const loserScore = Number(loserScoreRaw);

    if (!Number.isInteger(loserScore) || loserScore < 0) {
      setState({
        submitError: `Game ${gameNumber} has an invalid losing score.`,
        submitMessage: '',
      });
      return;
    }

    if (loserScore >= pointsToWin - 1) {
      setState({
        submitError: `Game ${gameNumber} losing score must stay below ${pointsToWin - 1} in this simplified entry mode.`,
        submitMessage: '',
      });
      return;
    }

    const player1Points = winner === 'player1' ? pointsToWin : loserScore;
    const player2Points = winner === 'player2' ? pointsToWin : loserScore;

    if (player1Points > player2Points) {
      player1Wins += 1;
    } else {
      player2Wins += 1;
    }

    sets.push([player1Points, player2Points]);

    if (player1Wins === requiredWins || player2Wins === requiredWins) {
      for (let remaining = gameNumber + 1; remaining <= bestOf; remaining += 1) {
        const leftoverSet = state.matchForm.sets[remaining - 1] ?? { winner: '', loserScore: '' };
        if (leftoverSet.winner || leftoverSet.loserScore !== '') {
          setState({
            submitError: `Stop entering scores after the match winner is decided. Extra scores found after Game ${gameNumber}.`,
            submitMessage: '',
          });
          return;
        }
      }
      break;
    }
  }

  if (!sets.length) {
    setState({
      submitError: 'Enter at least the completed games needed to determine the match winner.',
      submitMessage: '',
    });
    return;
  }

  if (Math.max(player1Wins, player2Wins) !== requiredWins) {
    setState({
      submitError: `A best-of-${bestOf} match must end when one player reaches ${requiredWins} game wins.`,
      submitMessage: '',
    });
    return;
  }

  setState({
    submitError: '',
    submitMessage: 'Saving match...',
  });

  const winnerId = player1Wins > player2Wins ? state.profile.id : opponentId;

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .insert({
      player1_id: state.profile.id,
      player2_id: opponentId,
      best_of: bestOf,
      points_to_win: pointsToWin,
      status: 'completed',
    })
    .select('id')
    .single();

  if (matchError) {
    setState({
      submitError: matchError.message,
      submitMessage: '',
    });
    return;
  }

  const scorecard = {
    player1_id: state.profile.id,
    player2_id: opponentId,
    sets,
    match_winner_id: winnerId,
  };

  const { error: scoreError } = await supabase.from('match_scores').insert({
    match_id: match.id,
    scorecard,
  });

  if (scoreError) {
    setState({
      submitError: scoreError.message,
      submitMessage: '',
    });
    return;
  }

  event.currentTarget.reset();

  setState({
    matchForm: normaliseMatchForm({
      opponentId: '',
      bestOf: 5,
      pointsToWin: 11,
      sets: [],
    }),
  });

  setState({
    submitError: '',
    submitMessage: 'Match saved. Reloading leaderboard and history...',
  });

  await Promise.all([loadLeaderboard(), loadPlayers(), loadHistory()]);

  setState({
    submitMessage: 'Match saved successfully.',
  });
}

async function loadLeaderboard() {
  const { data, error } = await supabase
    .from('player_rankings')
    .select('*')
    .order('points', { ascending: false });

  if (error) {
    setState({
      leaderboard: [],
      loadingLeaderboard: false,
      submitError: state.submitMessage ? error.message : state.submitError,
    });
    return;
  }

  setState({
    leaderboard: data ?? [],
    loadingLeaderboard: false,
  });
}

async function loadUserProfile() {
  if (!state.session?.user?.id) {
    setState({ profile: null });
    return;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, mobile, address, skill_level, auth_user_id')
    .eq('auth_user_id', state.session.user.id)
    .maybeSingle();

  if (error) {
    setState({
      profile: null,
      authError: error.message,
    });
    return;
  }

  setState({
    profile: data,
  });
}

async function loadPlayers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, skill_level')
    .order('name', { ascending: true });

  if (error) {
    setState({
      players: [],
      submitError: error.message,
    });
    return;
  }

  setState({
    players: data ?? [],
  });
}

async function loadHistory() {
  if (!state.profile) {
    setState({
      history: [],
      loadingHistory: false,
    });
    return;
  }

  setState({ loadingHistory: true });

  const { data, error } = await supabase
    .from('matches')
    .select(`
      id,
      match_date,
      best_of,
      points_to_win,
      player1_id,
      player2_id,
      score:match_scores (
        scorecard,
        winner_id
      ),
      player1:profiles!matches_player1_id_fkey (
        id,
        name
      ),
      player2:profiles!matches_player2_id_fkey (
        id,
        name
      )
    `)
    .order('match_date', { ascending: false });

  if (error) {
    setState({
      history: [],
      loadingHistory: false,
      submitError: error.message,
    });
    return;
  }

  const rankingsById = new Map(
    state.leaderboard.map((player, index) => [player.id, index + 1]),
  );

  const history = (data ?? []).flatMap((match) => {
    const score = Array.isArray(match.score) ? match.score[0] : match.score;

    if (!score?.scorecard?.sets) {
      return [];
    }

    const isPlayerOne = match.player1_id === state.profile.id;
    const opponent = isPlayerOne ? match.player2 : match.player1;
    const sets = Array.isArray(score.scorecard.sets) ? score.scorecard.sets : [];
    let playerGamesWon = 0;
    let opponentGamesWon = 0;

    for (const set of sets) {
      if (!Array.isArray(set) || set.length !== 2) {
        continue;
      }

      const playerPoints = isPlayerOne ? Number(set[0]) : Number(set[1]);
      const opponentPoints = isPlayerOne ? Number(set[1]) : Number(set[0]);

      if (playerPoints > opponentPoints) {
        playerGamesWon += 1;
      } else if (opponentPoints > playerPoints) {
        opponentGamesWon += 1;
      }
    }

    const setSummary = sets
      .map((set) => {
        if (!Array.isArray(set) || set.length !== 2) {
          return null;
        }

        const playerPoints = isPlayerOne ? Number(set[0]) : Number(set[1]);
        const opponentPoints = isPlayerOne ? Number(set[1]) : Number(set[0]);
        return `${playerPoints}-${opponentPoints}`;
      })
      .filter(Boolean)
      .join(', ');

    return [{
      id: match.id,
      opponentName: opponent?.name ?? 'Unknown player',
      opponentRank: opponent?.id ? rankingsById.get(opponent.id) : null,
      result: score.winner_id === state.profile.id ? 'Won' : 'Lost',
      score: `${playerGamesWon}-${opponentGamesWon}`,
      setSummary,
      formatSummary: `Best of ${match.best_of} · ${match.points_to_win} point game`,
      matchDate: match.match_date,
    }];
  });

  setState({
    history,
    loadingHistory: false,
  });
}

function updateSetEditorFromForm() {
  const opponentField = document.querySelector('#opponent-id');
  const bestOfField = document.querySelector('#best-of');
  const pointsField = document.querySelector('#points-to-win');

  if (!opponentField || !bestOfField || !pointsField) {
    return;
  }

  setState({
    matchForm: normaliseMatchForm({
      opponentId: opponentField.value,
      bestOf: Number(bestOfField.value),
      pointsToWin: Number(pointsField.value),
    }),
  });
}

function handleMatchConfigChange() {
  updateSetEditorFromForm();
}

function handleSetFieldChange(event) {
  const setIndex = Number(event.currentTarget.dataset.setIndex);
  const field = event.currentTarget.dataset.field;
  const value = event.currentTarget.value;
  const nextSets = state.matchForm.sets.map((set, index) => {
    if (index !== setIndex) {
      return set;
    }

    if (field === 'winner') {
      return {
        winner: value,
        loserScore: value ? set.loserScore : '',
      };
    }

    return {
      ...set,
      [field]: value,
    };
  });

  setState({
    matchForm: normaliseMatchForm({
      sets: nextSets,
    }),
  });
}

function handleOpponentChange(event) {
  setState({
    matchForm: normaliseMatchForm({
      opponentId: event.currentTarget.value,
    }),
  });
}

async function loadAuthedData() {
  if (!state.session) {
    setState({
      profile: null,
      players: [],
      history: [],
      loadingAuthData: false,
      loadingHistory: false,
    });
    return;
  }

  setState({
    loadingAuthData: true,
    authError: '',
    submitError: '',
  });

  await loadUserProfile();
  await loadPlayers();
  await loadHistory();

  setState({
    loadingAuthData: false,
  });
}

function subscribeToRealtimeUpdates() {
  supabase
    .channel('leaderboard-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, async () => {
      await loadLeaderboard();
      if (state.session) {
        await loadHistory();
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'match_scores' }, async () => {
      await loadLeaderboard();
      if (state.session) {
        await loadHistory();
      }
    })
    .subscribe();
}

async function initialise() {
  window.addEventListener('popstate', () => {
    render();

    if (getRoute().view === 'profile' && state.session) {
      void loadHistory();
    }
  });

  render();
  subscribeToRealtimeUpdates();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  setState({ session });

  await Promise.all([loadLeaderboard(), loadAuthedData()]);

  supabase.auth.onAuthStateChange(async (_event, sessionValue) => {
    setState({
      session: sessionValue,
      profile: null,
      players: [],
      history: [],
      submitError: '',
      submitMessage: '',
    });

    await loadAuthedData();

    if (sessionValue && getRoute().area === 'member') {
      render();
    }
  });
}

initialise();
