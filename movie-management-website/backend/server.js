import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import movieRoutes from "./routes/movies.js";
import userRoutes from "./routes/users.js";
import { connectDatabase } from "./data/db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// just so hitting the root URL in a browser shows something useful
app.get("/", (req, res) => {
  res.send("Movie management API is running. Try /api/movies");
});

app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/users", userRoutes);

// catch-all for routes that don't exist
app.use((req, res) => {
  res.status(404).json({ message: "That route doesn't exist." });
});

const PORT = process.env.PORT || 5000;
try {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("Could not start the server:", error.message);
  process.exit(1);
}
