import express from "express";
import { getUsers } from "../data/db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /api/users/me - logged in user's own info + watchlist
router.get("/me", requireAuth, async (req, res) => {
  const user = (await getUsers()).find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: "User not found." });

  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// GET /api/users - admin only, list every account (for the admin dashboard)
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  const users = (await getUsers()).map(({ password, ...rest }) => rest);
  res.json(users);
});

export default router;
