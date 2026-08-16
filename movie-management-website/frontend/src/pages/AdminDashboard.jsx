import { useEffect, useState } from "react";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import "../styles/Admin.css";

const emptyForm = {
  title: "",
  year: "",
  genre: "",
  rating: "",
  duration: "",
  description: "",
  poster: "",
  banner: "",
  featured: false,
};

export default function AdminDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState("movies"); // "movies" | "users"
  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [lookingUpMovie, setLookingUpMovie] = useState(false);
  const [refreshingPosters, setRefreshingPosters] = useState(false);
  const [posterRefreshMessage, setPosterRefreshMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setLoading(true);
    Promise.all([api.getMovies(), api.getAllUsers(token)])
      .then(([m, u]) => {
        setMovies(m);
        setUsers(u);
      })
      .finally(() => setLoading(false));
  }

  function openAddForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(movie) {
    setForm({
      title: movie.title,
      year: movie.year,
      genre: movie.genre.join(", "),
      rating: movie.rating,
      duration: movie.duration,
      description: movie.description,
      poster: movie.poster,
      banner: movie.banner,
      featured: movie.featured,
    });
    setEditingId(movie.id);
    setFormError("");
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this movie? This can't be undone.")) return;
    await api.deleteMovie(id, token);
    setMovies((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleOmdbLookup() {
    if (!form.title.trim()) {
      setFormError("Enter a title, then use Find details.");
      return;
    }

    setFormError("");
    setLookingUpMovie(true);
    try {
      const movie = await api.searchOmdb(form.title, form.year, token);
      setForm((current) => ({
        ...current,
        title: movie.title,
        year: movie.year || current.year,
        genre: movie.genre.join(", "),
        rating: movie.rating || "",
        duration: movie.duration,
        description: movie.description,
        poster: movie.poster,
      }));
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLookingUpMovie(false);
    }
  }

  async function handleRefreshPosters() {
    setRefreshingPosters(true);
    setPosterRefreshMessage("");
    try {
      const result = await api.refreshOmdbPosters(token);
      setMovies(result.movies);
      setPosterRefreshMessage(
        `Updated ${result.updated} poster${result.updated === 1 ? "" : "s"}. ${result.unavailable} title${result.unavailable === 1 ? " was" : "s were"} not available in OMDb yet.`
      );
    } catch (err) {
      setPosterRefreshMessage(err.message);
    } finally {
      setRefreshingPosters(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.title || !form.year) {
      setFormError("Title and year are required.");
      return;
    }

    const payload = {
      title: form.title,
      year: Number(form.year),
      genre: form.genre
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      rating: Number(form.rating) || 0,
      duration: form.duration,
      description: form.description,
      poster: form.poster || undefined,
      banner: form.banner || undefined,
      featured: form.featured,
    };

    try {
      if (editingId) {
        const updated = await api.updateMovie(editingId, payload, token);
        setMovies((prev) => prev.map((m) => (m.id === editingId ? updated : m)));
      } else {
        const created = await api.addMovie(payload, token);
        setMovies((prev) => [...prev, created]);
      }
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>🛠️ Admin Dashboard</h1>
        <p>Manage the movie catalog and keep an eye on who's signed up.</p>
      </div>

      <div className="home-tabs">
        <button className={tab === "movies" ? "active" : ""} onClick={() => setTab("movies")}>
          Movies ({movies.length})
        </button>
        <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>
          Users ({users.length})
        </button>
      </div>

      {loading && <p className="status-text">Loading...</p>}

      {!loading && tab === "movies" && (
        <>
          <div className="admin-movie-actions">
            <button className="btn btn-secondary" onClick={handleRefreshPosters} disabled={refreshingPosters}>
              {refreshingPosters ? "Refreshing posters..." : "Refresh posters from OMDb"}
            </button>
            <button className="btn btn-primary add-movie-btn" onClick={openAddForm}>
              + Add New Movie
            </button>
          </div>
          {posterRefreshMessage && <p className="poster-refresh-message">{posterRefreshMessage}</p>}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Poster</th>
                  <th>Title</th>
                  <th>Year</th>
                  <th>Genre</th>
                  <th>Rating</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((movie) => (
                  <tr key={movie.id}>
                    <td>
                      <img src={movie.poster} alt="" className="admin-thumb" />
                    </td>
                    <td>{movie.title}</td>
                    <td>{movie.year}</td>
                    <td>{movie.genre.join(", ")}</td>
                    <td>⭐ {movie.rating}</td>
                    <td>{movie.featured ? "Yes" : "No"}</td>
                    <td className="admin-actions">
                      <button className="btn-small" onClick={() => openEditForm(movie)}>
                        Edit
                      </button>
                      <button className="btn-small btn-danger" onClick={() => handleDelete(movie.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && tab === "users" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Watchlist size</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge role-${u.role}`}>{u.role}</span>
                  </td>
                  <td>{u.watchlist?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h2>{editingId ? "Edit Movie" : "Add New Movie"}</h2>
            {formError && <p className="auth-error">{formError}</p>}

            <label>
              Title
              <div className="title-lookup-row">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
                <button type="button" className="btn-small" onClick={handleOmdbLookup} disabled={lookingUpMovie}>
                  {lookingUpMovie ? "Finding..." : "Find details"}
                </button>
              </div>
              <small>Find details fills in the poster, year, rating, genres, runtime, and description from OMDb.</small>
            </label>

            <div className="modal-row">
              <label>
                Year
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  required
                />
              </label>
              <label>
                Rating (0-10)
                <input
                  type="number"
                  step="0.1"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                />
              </label>
            </div>

            <label>
              Genres (comma separated)
              <input
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                placeholder="Action, Sci-Fi"
              />
            </label>

            <label>
              Duration
              <input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="118 min"
              />
            </label>

            <label>
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </label>

            <label>
              Poster image URL
              <input
                value={form.poster}
                onChange={(e) => setForm({ ...form, poster: e.target.value })}
                placeholder="https://..."
              />
            </label>

            <label>
              Banner image URL
              <input
                value={form.banner}
                onChange={(e) => setForm({ ...form, banner: e.target.value })}
                placeholder="https://..."
              />
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              Feature this on the homepage hero
            </label>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingId ? "Save Changes" : "Add Movie"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
