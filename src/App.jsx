import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { hasSupabaseConfig, supabase } from './lib/supabase.js';
import { PublicHome } from './pages/PublicHome.jsx';
import { ClubRankings } from './pages/ClubRankings.jsx';
import { MemberGate } from './pages/MemberGate.jsx';
import { MemberHome } from './pages/MemberHome.jsx';
import { MemberLayout } from './pages/MemberLayout.jsx';
import { MemberMatches } from './pages/MemberMatches.jsx';
import { MemberProfile } from './pages/MemberProfile.jsx';
import { MemberProfileSettings } from './pages/MemberProfileSettings.jsx';
import { SkillLadder } from './pages/SkillLadder.jsx';
import { AdminPlayers, CoachingPlayers } from './pages/AdminPlayers.jsx';
import { getUserProfile, listLeaderboard, listPlayers } from './services/profiles.js';
import { listMemberMatches } from './services/matches.js';
import { listSkillMedia } from './services/media.js';
import { listSkillLadderData } from './services/skills.js';
import { buildMatchHistory } from './utils/matchHistory.js';

export function App() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [profile, setProfile] = useState(null);
  const [players, setPlayers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [history, setHistory] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillProgress, setSkillProgress] = useState([]);
  const [skillMedia, setSkillMedia] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [loadingAuthData, setLoadingAuthData] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSkillLadder, setLoadingSkillLadder] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [skillError, setSkillError] = useState('');
  const isAdmin = profile?.roles?.includes('admin') ?? false;
  const isCoach = profile?.roles?.includes('coach') ?? false;

  if (!hasSupabaseConfig) {
    return (
      <main className="container">
        <section className="card panel">
          <p className="message error">Missing Vite env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file.</p>
        </section>
      </main>
    );
  }

  const refreshLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      setLeaderboard(await listLeaderboard());
    } catch (error) {
      setAuthError(error.message);
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const refreshHistory = async (currentProfile = profile, currentLeaderboard = leaderboard) => {
    if (!currentProfile) {
      setHistory([]);
      setLoadingHistory(false);
      return;
    }

    setLoadingHistory(true);
    try {
      const matches = await listMemberMatches();
      setHistory(buildMatchHistory(matches, currentProfile, currentLeaderboard));
    } catch (error) {
      setAuthError(error.message);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const refreshSkillLadder = async (currentProfile = profile) => {
    if (!currentProfile) {
      setSkillCategories([]);
      setSkills([]);
      setSkillProgress([]);
      setSkillMedia([]);
      setLoadingSkillLadder(false);
      return;
    }

    setLoadingSkillLadder(true);
    setSkillError('');

    try {
      const data = await listSkillLadderData(currentProfile.id);
      const media = await listSkillMedia(data.progress.map((item) => item.id));
      setSkillCategories(data.categories);
      setSkills(data.skills);
      setSkillProgress(data.progress);
      setSkillMedia(media);
    } catch (error) {
      setSkillCategories([]);
      setSkills([]);
      setSkillProgress([]);
      setSkillMedia([]);
      setSkillError(error.message);
    } finally {
      setLoadingSkillLadder(false);
    }
  };

  const refreshAuthedData = async (currentSession = session) => {
    if (!currentSession) {
      setProfile(null);
      setPlayers([]);
      setHistory([]);
      setSkillCategories([]);
      setSkills([]);
      setSkillProgress([]);
      setSkillMedia([]);
      setLoadingAuthData(false);
      setLoadingHistory(false);
      setLoadingSkillLadder(false);
      return;
    }

    setLoadingAuthData(true);
    setAuthError('');

    try {
      const [nextProfile, nextPlayers, nextLeaderboard] = await Promise.all([
        getUserProfile(currentSession.user.id),
        listPlayers(),
        listLeaderboard(),
      ]);

      setProfile(nextProfile);
      setPlayers(nextPlayers);
      setLeaderboard(nextLeaderboard);
      setLoadingLeaderboard(false);

      await Promise.all([
        refreshHistory(nextProfile, nextLeaderboard),
        refreshSkillLadder(nextProfile),
      ]);
    } catch (error) {
      setAuthError(error.message);
      setProfile(null);
    } finally {
      setLoadingAuthData(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialise = async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(initialSession);
      await Promise.all([refreshLeaderboard(), refreshAuthedData(initialSession)]);
    };

    initialise();

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setProfile(null);
      setPlayers([]);
      setHistory([]);
      setSkillCategories([]);
      setSkills([]);
      setSkillProgress([]);
      setSkillMedia([]);
      setAuthError('');
      setAuthMessage('');
      setSkillError('');

      window.setTimeout(() => {
        void refreshAuthedData(nextSession);
      }, 0);
    });

    const channel = supabase
      .channel('leaderboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, async () => {
        await refreshLeaderboard();
        await refreshHistory();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_scores' }, async () => {
        await refreshLeaderboard();
        await refreshHistory();
      })
      .subscribe();

    return () => {
      mounted = false;
      authSubscription.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    setAuthError('');
    setAuthMessage('Signing in...');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthError(error.message);
      setAuthMessage('');
      return;
    }

    setAuthMessage('Signed in successfully.');
    setShowLogin(false);
  };

  const handleLogout = async () => {
    setAuthError('');
    setAuthMessage('Signing out...');

    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(error.message);
      setAuthMessage('');
      return;
    }

    setShowLogin(false);
    setAuthMessage('Signed out.');
    navigate('/');
  };

  const handleMatchSaved = async () => {
    const nextLeaderboard = await listLeaderboard();
    const nextPlayers = await listPlayers();
    setLeaderboard(nextLeaderboard);
    setPlayers(nextPlayers);
    await refreshHistory(profile, nextLeaderboard);
  };

  const handleProgressSaved = (savedProgress) => {
    setSkillProgress((current) => [
      ...current.filter((item) => item.skill_id !== savedProgress.skill_id),
      savedProgress,
    ]);
  };

  const handleSkillMediaUploaded = ({ progress: savedProgress, media }) => {
    handleProgressSaved(savedProgress);
    setSkillMedia((current) => [media, ...current]);
  };

  const handleSkillMediaUpdated = (updatedMedia) => {
    setSkillMedia((current) => current.map((item) => (
      item.id === updatedMedia.id ? { ...item, ...updatedMedia } : item
    )));
  };

  const handleSkillMediaDeleted = (mediaId) => {
    setSkillMedia((current) => current.filter((item) => item.id !== mediaId));
  };

  const memberElement = session ? (
    <MemberLayout
      session={session}
      profile={profile}
      loadingAuthData={loadingAuthData}
      authError={authError}
      authMessage={authMessage}
      isAdmin={isAdmin}
      isCoach={isCoach}
      onLogout={handleLogout}
      onRetryProfile={() => refreshAuthedData(session)}
    />
  ) : (
    <MemberGate
      showLogin={showLogin}
      authError={authError}
      authMessage={authMessage}
      onToggleLogin={() => setShowLogin((value) => !value)}
      onLogin={handleLogin}
    />
  );

  return (
    <main className="container">
      <Routes>
        <Route
          path="/"
          element={(
            <PublicHome
              session={session}
              showLogin={showLogin}
              authError={authError}
              authMessage={authMessage}
              onToggleLogin={() => {
                setAuthError('');
                setAuthMessage('');
                setShowLogin((value) => !value);
              }}
              onLogin={handleLogin}
            />
          )}
        />
        <Route path="/member" element={memberElement}>
          <Route
            index
            element={(
              <MemberHome
                profile={profile}
                leaderboard={leaderboard}
                history={history}
                skills={skills}
                skillProgress={skillProgress}
              />
            )}
          />
          <Route
            path="profile"
            element={(
              <MemberProfile
                profile={profile}
                history={history}
                loadingAuthData={loadingAuthData}
                loadingHistory={loadingHistory}
                onRetryProfile={() => refreshAuthedData(session)}
                onProfileUpdated={() => refreshAuthedData(session)}
              />
            )}
          />
          <Route
            path="profile/settings"
            element={(
              <MemberProfileSettings
                profile={profile}
                loadingAuthData={loadingAuthData}
                onRetryProfile={() => refreshAuthedData(session)}
              />
            )}
          />
          <Route
            path="matches"
            element={(
              <MemberMatches
                profile={profile}
                players={players}
                history={history}
                loadingAuthData={loadingAuthData}
                loadingHistory={loadingHistory}
                onMatchSaved={handleMatchSaved}
              />
            )}
          />
          <Route
            path="skills"
            element={(
              <SkillLadder
                profile={profile}
                categories={skillCategories}
                skills={skills}
                progress={skillProgress}
                skillMedia={skillMedia}
                loadingAuthData={loadingAuthData}
                loadingSkillLadder={loadingSkillLadder}
                skillError={skillError}
                onProgressSaved={handleProgressSaved}
                onMediaUploaded={handleSkillMediaUploaded}
                onMediaUpdated={handleSkillMediaUpdated}
                onMediaDeleted={handleSkillMediaDeleted}
              />
            )}
          />
          <Route path="rankings" element={<ClubRankings leaderboard={leaderboard} loadingLeaderboard={loadingLeaderboard} />} />
          <Route path="admin" element={<AdminPlayers isAdmin={isAdmin} />} />
          <Route path="coaching" element={<CoachingPlayers isCoach={isCoach} coachProfileId={profile?.id} />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}
