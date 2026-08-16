import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import MovieCard from "../components/MovieCard";
import "../styles/Landing.css";

export default function Landing() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getMovies()
      .then(setMovies)
      .catch(() => setError("Couldn't load movies right now. Is the backend server running?"))
      .finally(() => setLoading(false));
  }, []);

  const featured = movies.find((m) => m.featured) || movies[0];

  return (
    <div className="landing">
      {/* HERO */}
      <section className="hero">
        {featured && (
          <img src={featured.banner} alt="" className="hero-bg" />
        )}
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <h1>
            Welcome to <span className="brand-highlight">CineNest</span> 🍿
          </h1>
          <p className="hero-subtitle">
            My mini Netflix/Hotstar-style project — browse what's playing right now,
            build your own watchlist, and (soon) actually stream stuff. Built with
            React, Node.js, Express &amp; a sprinkle of CSS.
          </p>

          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary">
              Get Started — It's Free
            </Link>
            <Link to="/login" className="btn btn-secondary">
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* MOVIE GRID */}
      <section className="showcase">
        <h2 className="section-heading">🔥 Now Showing</h2>
        <p className="section-subheading">
          A real (ish) lineup of movies out in theaters right now.
        </p>

        {loading && <p className="status-text">Loading movies...</p>}
        {error && <p className="status-text error-text">{error}</p>}

        <div className="movie-grid">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} showWatchlistBtn={false} />
          ))}
        </div>
      </section>

      {/* ABOUT / FEATURES - kept it simple, this is just a student project! */}
      <section className="about-strip">
        <div className="about-card">
          <h3>🔐 Login &amp; Signup</h3>
          <p>Create an account or log in — your session is remembered with a token.</p>
        </div>
        <div className="about-card">
          <h3>🧑‍🤝‍🧑 Two Roles</h3>
          <p>Regular users browse movies &amp; build a watchlist. Admins manage the catalog.</p>
        </div>
        <div className="about-card">
          <h3>🗄️ Real Backend</h3>
          <p>Node.js + Express API. Currently saves to a JSON file, easy to swap for a real DB.</p>
        </div>
      </section>

      <footer className="landing-footer">
        <p>Made with React &amp; Node.js as a learning project 🎬 — not affiliated with Netflix or Hotstar.</p>
        <p className="demo-hint">
          Demo admin login: <code>admin@movieapp.com</code> / <code>admin123</code> &nbsp;|&nbsp;
          Demo user login: <code>user@movieapp.com</code> / <code>user123</code>
        </p>
      </footer>
    </div>
  );
}
