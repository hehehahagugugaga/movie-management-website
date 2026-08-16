import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import MovieCard from "../components/MovieCard";
import "../styles/Home.css";

export default function Home() {
  const { token, user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("browse"); // "browse" | "mylist"

  useEffect(() => {
    let isMounted = true;

    // Fetch movies always (doesn't require auth)
    api.getMovies()
      .then((movieData) => {
        if (isMounted) setMovies(movieData);
      })
      .catch((err) => {
        console.error("Failed to fetch movies:", err);
        if (isMounted) setMovies([]); // Set empty array on error
      });

    // Fetch user data only if we have a token
    if (token) {
      api.getMe(token)
        .then((meData) => {
          if (isMounted) setWatchlist(meData.watchlist || []);
        })
        .catch((err) => {
          console.error("Failed to fetch user data:", err);
          if (isMounted) setWatchlist([]); // Clear watchlist on error
        });
    } else {
      // No token, clear watchlist
      setWatchlist([]);
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const genres = useMemo(() => {
    const all = new Set(["All"]);
    movies.forEach((m) => m.genre.forEach((g) => all.add(g)));
    return Array.from(all);
  }, [movies]);

  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const matchesGenre = genreFilter === "All" || m.genre.includes(genreFilter);
      return matchesSearch && matchesGenre;
    });
  }, [movies, search, genreFilter]);

  const moviesByGenre = useMemo(() => {
    const groups = new Map();
    movies.forEach((movie) => {
      const primaryGenre = movie.genre[0] || "Other";
      if (!groups.has(primaryGenre)) groups.set(primaryGenre, []);
      groups.get(primaryGenre).push(movie);
    });
    return Array.from(groups.entries()).sort(([first], [second]) => first.localeCompare(second));
  }, [movies]);

  const listToShow =
    tab === "mylist" ? filteredMovies.filter((m) => watchlist.includes(m.id)) : filteredMovies;

  async function handleToggleWatchlist(movieId) {
    // update UI right away, then confirm with the server
    setWatchlist((prev) =>
      prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId]
    );
    try {
      const data = await api.toggleWatchlist(movieId, token);
      setWatchlist(data.watchlist);
    } catch {
      // if it failed, just refetch to stay in sync
      const me = await api.getMe(token);
      setWatchlist(me.watchlist || []);
    }
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>Welcome back, {user.name.split(" ")[0]} 👋</h1>
        <p>Here's what's showing right now.</p>
      </div>

      <div className="home-tabs">
        <button className={tab === "browse" ? "active" : ""} onClick={() => setTab("browse")}>
          Browse All
        </button>
        <button className={tab === "mylist" ? "active" : ""} onClick={() => setTab("mylist")}>
          My List ({watchlist.length})
        </button>
      </div>

      <div className="home-filters">
        <input
          type="text"
          placeholder="Search movies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="status-text">Loading...</p>}

      {!loading && listToShow.length === 0 && (
        <p className="status-text">
          {tab === "mylist" ? "Your list is empty — go add something!" : "No movies match your search."}
        </p>
      )}

      {!loading && tab === "browse" && genreFilter === "All" && !search ? (
        <div className="genre-shelves">
          {moviesByGenre.map(([genre, genreMovies]) => (
            <section className="genre-shelf" key={genre}>
              <h2>{genre}</h2>
              <div className="movie-grid genre-movie-grid">
                {genreMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    showWatchlistBtn
                    inWatchlist={watchlist.includes(movie.id)}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="movie-grid">
          {listToShow.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              showWatchlistBtn
              inWatchlist={watchlist.includes(movie.id)}
              onToggleWatchlist={handleToggleWatchlist}
            />
          ))}
        </div>
      )}
    </div>
  );
}
