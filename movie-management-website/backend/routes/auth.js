import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUsers, saveUsers, getNextUserId } from "../data/db.js";

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || "dev_secret_change_me",
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are all required." });
  }

  const users = await getUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: "An account with that email already exists." });
  }

  const hashedPassword = await bcrypt.hash(password, 8);

  // NOTE: everyone who signs up gets the "user" role. Admin accounts
  // have to be created directly in the data for now (see README).
  const newUser = {
    id: await getNextUserId(),
    name,
    email,
    password: hashedPassword,
    role: "user",
    watchlist: [],
  };

  users.push(newUser);
  await saveUsers(users);

  const token = makeToken(newUser);
  res.status(201).json({
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
  });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const users = await getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ message: "Incorrect email or password." });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Incorrect email or password." });
  }

  const token = makeToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

export default router;
