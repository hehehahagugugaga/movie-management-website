import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGACY_DB_PATH = path.join(__dirname, "db.json");

const movieSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  year: Number,
  genre: { type: [String], default: [] },
  rating: { type: Number, default: 0 },
  duration: { type: String, default: "" },
  description: { type: String, default: "" },
  poster: { type: String, default: "" },
  banner: { type: String, default: "" },
  featured: { type: Boolean, default: false },
}, { versionKey: false });

const userSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  watchlist: { type: [Number], default: [] },
}, { versionKey: false });

const Movie = mongoose.models.Movie || mongoose.model("Movie", movieSchema);
const User = mongoose.models.User || mongoose.model("User", userSchema);

function withoutMongoId(document) {
  const { _id, ...data } = document;
  return data;
}

async function migrateLegacyData() {
  const hasData = (await Movie.countDocuments()) > 0 || (await User.countDocuments()) > 0;
  if (hasData || !fs.existsSync(LEGACY_DB_PATH)) return;

  const legacyData = JSON.parse(fs.readFileSync(LEGACY_DB_PATH, "utf-8"));
  if (legacyData.users?.length) await User.insertMany(legacyData.users, { ordered: false });
  if (legacyData.movies?.length) await Movie.insertMany(legacyData.movies, { ordered: false });
  console.log("Migrated existing JSON data to MongoDB.");
}

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Add your MongoDB Atlas connection string to backend/.env.");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  await migrateLegacyData();
  console.log("Connected to MongoDB.");
}

export async function getUsers() {
  return User.find().sort({ id: 1 }).lean();
}

export async function saveUsers(users) {
  const operations = users.map((user) => ({
    replaceOne: { filter: { id: user.id }, replacement: withoutMongoId(user), upsert: true },
  }));
  if (operations.length) await User.bulkWrite(operations);
  await User.deleteMany({ id: { $nin: users.map((user) => user.id) } });
}

export async function getNextUserId() {
  const latestUser = await User.findOne().sort({ id: -1 }).select("id").lean();
  return (latestUser?.id || 0) + 1;
}

export async function getMovies() {
  return Movie.find().sort({ id: 1 }).lean();
}

export async function saveMovies(movies) {
  const operations = movies.map((movie) => ({
    replaceOne: { filter: { id: movie.id }, replacement: withoutMongoId(movie), upsert: true },
  }));
  if (operations.length) await Movie.bulkWrite(operations);
  await Movie.deleteMany({ id: { $nin: movies.map((movie) => movie.id) } });
}

export async function getNextMovieId() {
  const latestMovie = await Movie.findOne().sort({ id: -1 }).select("id").lean();
  return (latestMovie?.id || 0) + 1;
}
