# CineNest 🎬 — Movie Management Website

A little Netflix/Hotstar-style movie browsing app I built to practice React + Node.js.
Has login/signup, two user roles (regular user vs admin), a browsable movie catalog,
personal watchlists, and an admin dashboard to add/edit/delete movies.

## Tech stack

- **Frontend:** React (Vite) + React Router — plain CSS, no UI library
- **Backend:** Node.js + Express
- **Auth:** JWT tokens + bcrypt password hashing
- **"Database":** a JSON file (`backend/data/db.json`) for now — see below for how to swap in a real one

## Project structure

```
movie-management-website/
├── backend/
│   ├── data/
│   │   ├── db.js          <- all "database" reads/writes go through here
│   │   └── db.json         (auto-created on first run, seeded with movies + demo accounts)
│   ├── middleware/
│   │   └── auth.js         <- checks login token / admin role
│   ├── routes/
│   │   ├── auth.js         <- /api/auth/register, /api/auth/login
│   │   ├── movies.js       <- /api/movies (CRUD) + watchlist toggle
│   │   └── users.js        <- /api/users/me, /api/users (admin only)
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/api.js          <- fetch wrapper for calling the backend
    │   ├── context/AuthContext.jsx
    │   ├── components/         <- Navbar, MovieCard, ProtectedRoute
    │   ├── pages/               <- Landing, Login, Signup, Home, AdminDashboard, NotFound
    │   └── styles/
    └── package.json
```

## Running it locally

You need [Node.js](https://nodejs.org/) 18+ installed.

**1. Backend**

```bash
cd backend
npm install
cp .env.example .env      # then optionally edit JWT_SECRET in .env
npm run dev                # or: npm start
```

The API runs on `http://localhost:5000`. On first run it auto-creates
`backend/data/db.json` with the movie catalog and two demo accounts:

| Role  | Email                 | Password  |
|-------|-----------------------|-----------|
| Admin | admin@movieapp.com    | admin123  |
| User  | user@movieapp.com     | user123   |

**2. Frontend** (in a separate terminal)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/...` requests
to the backend on port 5000, so both need to be running.

## What each role can do

- **Everyone (not logged in):** see the landing page and browse the movie catalog
- **User:** browse/search/filter movies, add & remove movies from their own watchlist
- **Admin:** everything a user can do, plus a dashboard to add, edit, and delete movies,
  and a read-only view of every registered account

## Adding a real database later

Right now `backend/data/db.js` is the *only* file that touches storage — every route
(`routes/auth.js`, `routes/movies.js`, `routes/users.js`) just calls its exported
functions (`getMovies`, `saveMovies`, `getUsers`, `saveUsers`, etc.) and has no idea
the data is actually sitting in a JSON file.

To switch to a real database (MongoDB, PostgreSQL, etc.):

1. Add your connection string to `backend/.env` (there's a placeholder section for it already)
2. Install a driver/ORM, e.g. `npm install mongoose` or `npm install pg prisma`
3. Rewrite the insides of the functions in `backend/data/db.js` to read/write your
   real database instead of the JSON file — keep the function names and what they
   return the same, so `routes/*.js` don't need to change at all
4. Delete `backend/data/db.json` and the `seedDb()` function once you have a real
   seeding/migration step for your database

## Notes / things that are intentionally simple

- Passwords are hashed with bcrypt, but there's no "forgot password" flow
- New signups always get the `user` role — to make someone an admin, edit their
  entry in `db.json` (or your real DB once it's connected) and change `"role"` to `"admin"`
- Movie posters/banners are placeholder images — swap the URLs in `db.json` (or through
  the admin "Add/Edit Movie" form) for real poster art whenever you want
- There's no actual video streaming — it's a *movie management* app, not a video player,
  so "watching" just means browsing details and keeping a list
