import "../styles/MovieCard.css";

export default function MovieCard({ movie, inWatchlist, onToggleWatchlist, showWatchlistBtn }) {
  return (
    <div className="movie-card">
      <div className="movie-poster-wrap">
        <img src={movie.poster} alt={movie.title} className="movie-poster" loading="lazy" />
        <div className="movie-rating">⭐ {movie.rating}</div>
      </div>

      <div className="movie-card-body">
        <h3 className="movie-title">{movie.title}</h3>
        <p className="movie-meta">
          {movie.year} • {movie.duration}
        </p>
        <p className="movie-genres">{movie.genre.join(", ")}</p>

        {showWatchlistBtn && (
          <button
            className={`watchlist-btn ${inWatchlist ? "in-list" : ""}`}
            onClick={() => onToggleWatchlist(movie.id)}
          >
            {inWatchlist ? "✓ In My List" : "+ Add to My List"}
          </button>
        )}
      </div>
    </div>
  );
}
