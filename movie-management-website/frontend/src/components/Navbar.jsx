import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        🎬 CineNest
      </Link>

      <div className="navbar-links">
        {!user && (
          <>
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/signup" className="navbar-cta">
              Sign Up
            </Link>
          </>
        )}

        {user && user.role === "user" && (
          <>
            <Link to="/home">Browse</Link>
            <span className="navbar-username">Hi, {user.name.split(" ")[0]}</span>
            <button className="navbar-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}

        {user && user.role === "admin" && (
          <>
            <Link to="/admin">Admin Dashboard</Link>
            <span className="navbar-username">Hi, {user.name.split(" ")[0]} (admin)</span>
            <button className="navbar-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
