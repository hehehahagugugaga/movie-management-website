import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "#fff" }}>
      <h1 style={{ fontSize: "4rem", margin: 0 }}>404</h1>
      <p>Oops, this page doesn't exist.</p>
      <Link to="/" style={{ color: "#a970ff" }}>
        Go back home
      </Link>
    </div>
  );
}
