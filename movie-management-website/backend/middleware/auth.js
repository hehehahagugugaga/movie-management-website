import jwt from "jsonwebtoken";

// checks that a valid login token was sent with the request
export function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "You need to be logged in to do that." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_change_me");
    req.user = decoded; // { id, name, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Your session expired, please log in again." });
  }
}

// use this AFTER requireAuth to only let admins through
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admins only!" });
  }
  next();
}
