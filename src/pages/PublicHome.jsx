import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm.jsx';
import { showcaseVideos, site, testimonials } from '../data/siteContent.js';

export function PublicHome({ session, showLogin, authError, authMessage, onToggleLogin, onLogin }) {
  return (
    <section className="landing">
      <header className="site-header card">
        <div className="site-header-inner">
          <a className="brand-lockup" href="#top">
            <img className="site-logo" src={site.logo} alt="Spin Force Table Tennis Club logo" />
            <div className="brand-copy">
              <strong>Spin Force</strong>
              <span>Table Tennis Club, Kochi</span>
            </div>
          </a>
          <nav className="site-nav" aria-label="Primary">
            <a href="#about">About</a>
            <a href="#highlights">Highlights</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="member-login">
            {session ? (
              <Link className="button member-login-button" to="/member">Open Member Area</Link>
            ) : (
              <button className="button member-login-button" type="button" onClick={onToggleLogin}>
                {showLogin ? 'Close Login' : 'Member Login'}
              </button>
            )}
          </div>
        </div>
        {showLogin ? <LoginForm authError={authError} authMessage={authMessage} onLogin={onLogin} /> : null}
      </header>

      <section id="top" className="hero-home card">
        <div className="hero-home-copy">
          <p className="eyebrow">Spin Force Table Tennis Club</p>
          <h1>Welcome to Spin Force Table Tennis Club, Kochi</h1>
          <p className="hero-lead">A focused club environment for training, competitive matchplay, skill development, and a strong local table tennis community.</p>
          <div className="hero-actions">
            <a className="button" href={site.mapUrl} target="_blank" rel="noreferrer">Get Directions</a>
            <a className="button button-secondary" href="#about">Explore The Club</a>
          </div>
        </div>
        <div className="hero-home-mark">
          <img className="hero-mark-logo" src={site.logo} alt="Spin Force crest" />
        </div>
      </section>

      <section id="about" className="story-grid">
        <section className="card panel story-card">
          <div className="card-header">
            <div>
              <h2>Welcome To The Club</h2>
              <p className="muted">This section should feel like a proper introduction, not a product screen.</p>
            </div>
          </div>
          <p className="body-copy">Spin Force Table Tennis Club is built for players who want more than occasional casual games. We care about coaching quality, competitive repetition, disciplined improvement, and a club environment where players at different levels can grow.</p>
          <p className="body-copy">Whether someone is stepping in as a beginner, returning to the sport, or training consistently for stronger match results, the goal is the same: give them a place where table tennis is taken seriously and enjoyed deeply.</p>
          <div className="feature-grid">
            <article className="feature-tile">
              <strong>Coaching</strong>
              <p>Structured sessions focused on technique, consistency, and match awareness.</p>
            </article>
            <article className="feature-tile">
              <strong>Competition</strong>
              <p>Real matchplay, club rankings, and a rhythm of improvement through play.</p>
            </article>
            <article className="feature-tile">
              <strong>Community</strong>
              <p>A serious but welcoming club culture for players and families in Kochi.</p>
            </article>
          </div>
        </section>

        <section className="card panel venue-card">
          <div className="card-header">
            <div>
              <h2>Visit Spin Force</h2>
              <p className="muted">Make the location and access details obvious for first-time visitors.</p>
            </div>
          </div>
          <dl className="details">
            <div>
              <dt>Location</dt>
              <dd>Kochi, Kerala</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{site.venueAddress}</dd>
            </div>
            <div>
              <dt>Maps</dt>
              <dd><a className="inline-link" href={site.mapUrl} target="_blank" rel="noreferrer">Open club location in Google Maps</a></dd>
            </div>
          </dl>
        </section>
      </section>

      <section id="highlights" className="card carousel-card">
        <div className="section-intro panel-heading">
          <div className="card-header panel-heading">
            <div>
              <h2>Club Highlights</h2>
              <p className="muted">Training clips, club moments, and match energy should live here. Videos play one after another automatically.</p>
            </div>
          </div>
        </div>
        <VideoCarousel />
      </section>

      <section id="testimonials" className="testimonials-block">
        <div className="section-heading">
          <p className="eyebrow dark">Member Voices</p>
          <h2>What People Say About Spin Force</h2>
          <p className="muted">These are placeholder testimonials for now. Replace them with real member photos and quotes when ready.</p>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((item) => (
            <article className="card testimonial-card" key={item.name}>
              <img className="testimonial-avatar" src={item.image} alt={item.name} />
              <div className="testimonial-copy">
                <p className="testimonial-quote">“{item.quote}”</p>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer id="contact" className="footer card panel">
        <div className="footer-block">
          <h2>Contact</h2>
          <p><a className="inline-link" href="tel:+919030358968">{site.contactNumber}</a></p>
        </div>
        <div className="footer-block">
          <h2>About</h2>
          <p>Spin Force is a Kochi-based table tennis club focused on training, matchplay, rankings, and a strong playing culture.</p>
        </div>
        <div className="footer-block">
          <h2>Address</h2>
          <p>{site.venueAddress}</p>
          <p><a className="inline-link" href={site.mapUrl} target="_blank" rel="noreferrer">View on Google Maps</a></p>
        </div>
        <div className="footer-block">
          <h2>Follow</h2>
          <p><a className="inline-link" href={site.youtubeUrl} target="_blank" rel="noreferrer">YouTube Channel</a></p>
          <p><a className="inline-link" href={site.instagramUrl} target="_blank" rel="noreferrer">Instagram Page</a></p>
        </div>
      </footer>
    </section>
  );
}

function VideoCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef(null);
  const currentVideo = showcaseVideos[activeIndex] ?? showcaseVideos[0];

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
  }, [activeIndex]);

  if (!showcaseVideos.length) {
    return (
      <div className="carousel-empty">
        <p className="message">No showcase videos added yet.</p>
      </div>
    );
  }

  const showPrevious = () => setActiveIndex((value) => (value - 1 + showcaseVideos.length) % showcaseVideos.length);
  const showNext = () => setActiveIndex((value) => (value + 1) % showcaseVideos.length);

  return (
    <div className="carousel-shell">
      <div className="carousel-frame">
        <video
          ref={videoRef}
          className="showcase-video"
          src={currentVideo.src}
          poster={currentVideo.poster ?? ''}
          muted
          playsInline
          controls
          autoPlay
          onEnded={showNext}
        />
      </div>
      <div className="carousel-meta">
        <strong>{currentVideo.title}</strong>
        {currentVideo.caption ? <p className="muted">{currentVideo.caption}</p> : null}
      </div>
      <div className="carousel-controls">
        <button className="button button-secondary" type="button" onClick={showPrevious}>Previous</button>
        <div className="carousel-dots">
          {showcaseVideos.map((video, index) => (
            <button
              className={`carousel-dot ${index === activeIndex ? 'active' : ''}`}
              type="button"
              key={video.src}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${video.title}`}
            />
          ))}
        </div>
        <button className="button button-secondary" type="button" onClick={showNext}>Next</button>
      </div>
    </div>
  );
}
