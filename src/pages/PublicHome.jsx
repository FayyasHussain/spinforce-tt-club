import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm.jsx';
import { showcaseVideos, site, testimonials } from '../data/siteContent.js';

const publicNavLinks = [
  { href: '#top', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#highlights', label: 'Highlights' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#contact', label: 'Contact' },
];

export function PublicHome({ session, showLogin, authError, authMessage, onToggleLogin, onLogin }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <section className="landing">
      <header className="site-header card">
        <div className="site-header-inner">
          <a className="brand-lockup" href="#top" onClick={closeMenu}>
            <img className="site-logo" src={site.logo} alt="Spin Force Table Tennis Club logo" />
            <div className="brand-copy">
              <strong>Spin Force</strong>
              <span>Table Tennis Club, Kochi</span>
            </div>
          </a>
          <nav className="site-nav" aria-label="Primary">
            {publicNavLinks.slice(1).map((link) => (
              <a href={link.href} key={link.href}>{link.label}</a>
            ))}
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
          <button
            className={`public-menu-button ${isMenuOpen ? 'open' : ''}`}
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <div className={`public-menu-panel ${isMenuOpen ? 'open' : ''}`}>
          <nav className="public-menu-links" aria-label="Mobile primary">
            {publicNavLinks.map((link) => (
              <a href={link.href} key={link.href} onClick={closeMenu}>{link.label}</a>
            ))}
            <a href={site.instagramUrl} target="_blank" rel="noreferrer" onClick={closeMenu}>Instagram</a>
          </nav>
          <div className="public-menu-actions">
            {session ? (
              <Link className="button" to="/member" onClick={closeMenu}>Open Member Area</Link>
            ) : (
              <button
                className="button"
                type="button"
                onClick={() => {
                  closeMenu();
                  onToggleLogin();
                }}
              >
                {showLogin ? 'Close Login' : 'Member Login'}
              </button>
            )}
            <a className="button button-secondary" href={site.whatsappUrl} target="_blank" rel="noreferrer" onClick={closeMenu}>Join On WhatsApp</a>
            <a className="button button-secondary" href={site.mapUrl} target="_blank" rel="noreferrer" onClick={closeMenu}>Get Directions</a>
          </div>
        </div>
        {showLogin ? <LoginForm authError={authError} authMessage={authMessage} onLogin={onLogin} /> : null}
      </header>

      <section id="top" className="hero-home card">
        <img className="hero-home-photo" src={site.heroImage} alt="Spin Force table tennis club session" />
        <div className="hero-home-copy">
          <h1>
            <span>Welcome to</span>
            <span>SpinForce TT Club</span>
          </h1>
          <p className="hero-lead">Kochi's new Home for Table Tennis</p>
          <div className="hero-actions">
            <a className="button" href={site.whatsappUrl} target="_blank" rel="noreferrer">Join On WhatsApp</a>
            <a className="button" href={site.mapUrl} target="_blank" rel="noreferrer">Get Directions</a>
          </div>
        </div>
      </section>

      <section id="about" className="story-grid">
        <section className="card panel story-card">
          <div className="card-header">
            <div>
              <h2>Welcome To The Club</h2>
              <p className="section-lead">A table tennis space in Kochi for coaching, community, events, and everyday play.</p>
            </div>
          </div>
          <p className="body-copy">Spin Force Table Tennis Club is a friendly, air-conditioned table tennis space where kids, adults, beginners, and serious players can learn, play, and stay active together. Come in for professional coaching, regular play, club events, or a lively evening with people who enjoy the game.</p>
          <p className="body-copy">We want the club to feel like a healthy alternative to gym routines and solo activities: social, energetic, skill-building, and easy for families to be part of. Whether you are picking up a racket for the first time or training for stronger match results, there is a place for you here.</p>
          <div className="feature-grid">
            <article className="feature-tile">
              <strong>Professional Coaching</strong>
              <p>Structured sessions for technique, footwork, consistency, and match awareness.</p>
            </article>
            <article className="feature-tile">
              <strong>Club Events</strong>
              <p>Regular play sessions, friendly match days, and events that bring players together.</p>
            </article>
            <article className="feature-tile">
              <strong>Vibrant Community</strong>
              <p>Meet people, find practice partners, and enjoy a club culture built around play.</p>
            </article>
            <article className="feature-tile">
              <strong>Comfortable Facility</strong>
              <p>A clean, comfortable, air-conditioned space designed for focused table tennis.</p>
            </article>
            <article className="feature-tile">
              <strong>Family Friendly</strong>
              <p>A welcoming environment for children, parents, adults, and first-time visitors.</p>
            </article>
            <article className="feature-tile">
              <strong>Active Lifestyle</strong>
              <p>A fun alternative to solo workouts, with movement, competition, and connection.</p>
            </article>
          </div>
        </section>

        <section className="card panel venue-card">
          <div className="card-header">
            <div>
              <h2>Visit Spin Force</h2>
              <p className="muted">Drop by for coaching, events, practice, or a first look at the club.</p>
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
              <h2>Inside Spin Force</h2>
              <p className="muted">A glimpse of coaching sessions, club events, match rallies, and the community energy at the table.</p>
            </div>
          </div>
        </div>
        <VideoCarousel />
      </section>

      <section id="testimonials" className="testimonials-block">
        <div className="section-heading">
          <p className="eyebrow dark">Member Voices</p>
          <h2>Stories From The Spin Force Community</h2>
          <p className="muted">Players and families come for coaching, matchplay, and a club environment that makes table tennis easy to enjoy consistently.</p>
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
      <a className="whatsapp-float" href={site.whatsappUrl} target="_blank" rel="noreferrer" aria-label="Contact Spin Force on WhatsApp">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M16 3.6A12.1 12.1 0 0 0 5.7 22.1L4 28.4l6.5-1.7A12.1 12.1 0 1 0 16 3.6Zm0 2.3a9.8 9.8 0 0 1 8.3 15l-.3.5.9 3.3-3.4-.9-.5.3A9.8 9.8 0 1 1 16 5.9Zm-4.1 4.4c-.2 0-.5.1-.7.4-.4.4-1.3 1.3-1.3 3.1s1.3 3.6 1.5 3.9c.2.2 2.5 4 6.3 5.4 3.1 1.2 3.8.9 4.4.9.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.7.2-1.9-.1-.2-.3-.3-.7-.5l-2.4-1.2c-.3-.1-.6-.2-.8.2l-1.1 1.4c-.2.2-.4.3-.8.1-.3-.2-1.5-.6-2.9-1.8-1.1-1-1.8-2.2-2-2.5-.2-.4 0-.6.2-.8l.5-.6c.2-.2.2-.4.4-.6.1-.2.1-.4 0-.6l-1.1-2.7c-.3-.6-.5-.6-.8-.6h-.6Z" />
        </svg>
      </a>
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
