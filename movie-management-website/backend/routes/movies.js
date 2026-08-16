import express from "express";
import { getMovies, saveMovies, getNextMovieId, getUsers, saveUsers } from "../data/db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /api/movies - anyone can browse the catalog, logged in or not
router.get("/", async (req, res) => {
  res.json(await getMovies());
});

// GET /api/movies/omdb/search?title=...&year=...
// Kept behind the admin check so the OMDb key is never exposed to the browser.
router.get("/omdb/search", requireAuth, requireAdmin, async (req, res) => {
  const title = req.query.title?.trim();
  const year = req.query.year?.trim();

  if (!title) {
    return res.status(400).json({ message: "Enter a movie title to search OMDb." });
  }

  if (!process.env.OMDB_API_KEY) {
    return res.status(503).json({ message: "OMDb is not configured. Add OMDB_API_KEY to backend/.env." });
  }

  const params = new URLSearchParams({
    t: title,
    apikey: process.env.OMDB_API_KEY,
  });
  if (year) params.set("y", year);

  try {
    const omdbResponse = await fetch(`https://www.omdbapi.com/?${params}`);
    const movie = await omdbResponse.json();

    if (!omdbResponse.ok || movie.Response === "False") {
      return res.status(404).json({ message: movie.Error || "No movie was found in OMDb." });
    }

    const parsedYear = Number.parseInt(movie.Year, 10);
    res.json({
      title: movie.Title,
      year: Number.isFinite(parsedYear) ? parsedYear : "",
      genre: movie.Genre && movie.Genre !== "N/A" ? movie.Genre.split(", ") : [],
      rating: movie.imdbRating && movie.imdbRating !== "N/A" ? Number(movie.imdbRating) : 0,
      duration: movie.Runtime && movie.Runtime !== "N/A" ? movie.Runtime : "",
      description: movie.Plot && movie.Plot !== "N/A" ? movie.Plot : "",
      poster: movie.Poster && movie.Poster !== "N/A" ? movie.Poster : "",
    });
  } catch {
    res.status(502).json({ message: "Couldn't reach OMDb right now. Please try again." });
  }
});

// POST /api/movies/omdb/refresh-posters
// Updates every catalog poster that OMDb can identify. Titles that OMDb does
// not know yet (such as some upcoming releases) are left unchanged.
router.post("/omdb/refresh-posters", requireAuth, requireAdmin, async (req, res) => {
  if (!process.env.OMDB_API_KEY) {
    return res.status(503).json({ message: "OMDb is not configured. Add OMDB_API_KEY to backend/.env." });
  }

  const movies = await getMovies();
  const results = await Promise.all(
    movies.map(async (catalogMovie) => {
      try {
        const findPoster = async (title, year) => {
          const params = new URLSearchParams({ t: title, apikey: process.env.OMDB_API_KEY });
          if (year) params.set("y", String(year));
          const omdbResponse = await fetch(`https://www.omdbapi.com/?${params}`);
          const omdbMovie = await omdbResponse.json();
          return omdbResponse.ok && omdbMovie.Response !== "False" && omdbMovie.Poster !== "N/A"
            ? omdbMovie.Poster
            : null;
        };

        let poster = await findPoster(catalogMovie.title, catalogMovie.year);
        // OMDb often stores anniversary/re-release editions under the base title.
        if (!poster) {
          const baseTitle = catalogMovie.title.replace(/\s*\([^)]*\)\s*$/, "");
          if (baseTitle !== catalogMovie.title) poster = await findPoster(baseTitle);
        }
        return { id: catalogMovie.id, poster };
      } catch {
        return { id: catalogMovie.id, poster: null };
      }
    })
  );

  const postersById = new Map(results.filter((result) => result.poster).map((result) => [result.id, result.poster]));
  const updatedMovies = movies.map((movie) =>
    postersById.has(movie.id) ? { ...movie, poster: postersById.get(movie.id) } : movie
  );

  if (postersById.size > 0) await saveMovies(updatedMovies);
  res.json({ movies: updatedMovies, updated: postersById.size, unavailable: movies.length - postersById.size });
});

// GET /api/movies/:id
router.get("/:id", async (req, res) => {
  const movie = (await getMovies()).find((m) => m.id === Number(req.params.id));
  if (!movie) return res.status(404).json({ message: "Couldn't find that movie." });
  res.json(movie);
});

// POST /api/movies - admin only, add a new movie
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { title, year, genre, rating, duration, description, poster, banner, featured } = req.body;

  if (!title || !year) {
    return res.status(400).json({ message: "A movie needs at least a title and a year." });
  }

  const movies = await getMovies();
  const newMovie = {
    id: await getNextMovieId(),
    title,
    year,
    genre: genre || [],
    rating: rating || 0,
    duration: duration || "",
    description: description || "",
    poster: poster || "https://placehold.co/300x445/222/fff?text=No+Poster",
    banner: banner || "https://placehold.co/1280x480/222/fff?text=No+Banner",
    featured: !!featured,
  };

  movies.push(newMovie);
  await saveMovies(movies);
  res.status(201).json(newMovie);
});

// PUT /api/movies/:id - admin only, edit a movie
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const movies = await getMovies();
  const index = movies.findIndex((m) => m.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: "Couldn't find that movie." });
  }

  movies[index] = { ...movies[index], ...req.body, id: movies[index].id };
  await saveMovies(movies);
  res.json(movies[index]);
});

// DELETE /api/movies/:id - admin only
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const movies = await getMovies();
  const exists = movies.some((m) => m.id === Number(req.params.id));

  if (!exists) {
    return res.status(404).json({ message: "Couldn't find that movie." });
  }

  const updated = movies.filter((m) => m.id !== Number(req.params.id));
  await saveMovies(updated);
  res.json({ message: "Movie deleted." });
});

// POST /api/movies/:id/watchlist - logged in users can add/remove from their watchlist
router.post("/:id/watchlist", requireAuth, async (req, res) => {
  const movieId = Number(req.params.id);
  const users = await getUsers();
  const userIndex = users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found." });
  }

  const user = users[userIndex];
  const alreadyInList = user.watchlist.includes(movieId);

  user.watchlist = alreadyInList
    ? user.watchlist.filter((id) => id !== movieId)
    : [...user.watchlist, movieId];

  await saveUsers(users);
  res.json({ watchlist: user.watchlist });
});

export default router;
