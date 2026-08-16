// Small helper so I don't have to rewrite fetch() + headers everywhere.
// Everything goes through /api/... which vite.config.js proxies to the
// Express backend during development.

const BASE_URL = "/api";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data;
}

export const api = {
  // auth
  register: (name, email, password) =>
    request("/auth/register", { method: "POST", body: { name, email, password } }),
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),

  // movies
  getMovies: () => request("/movies"),
  getMovie: (id) => request(`/movies/${id}`),
  searchOmdb: (title, year, token) => {
    const params = new URLSearchParams({ title });
    if (year) params.set("year", year);
    return request(`/movies/omdb/search?${params}`, { token });
  },
  refreshOmdbPosters: (token) =>
    request("/movies/omdb/refresh-posters", { method: "POST", token }),
  addMovie: (movie, token) => request("/movies", { method: "POST", body: movie, token }),
  updateMovie: (id, movie, token) =>
    request(`/movies/${id}`, { method: "PUT", body: movie, token }),
  deleteMovie: (id, token) => request(`/movies/${id}`, { method: "DELETE", token }),
  toggleWatchlist: (id, token) => request(`/movies/${id}/watchlist`, { method: "POST", token }),

  // users
  getMe: (token) => request("/users/me", { token }),
  getAllUsers: (token) => request("/users", { token }),
};
