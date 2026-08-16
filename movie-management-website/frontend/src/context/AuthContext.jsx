import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("cinenest_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("cinenest_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  // keep localStorage in sync whenever token/user change
  useEffect(() => {
    if (token) localStorage.setItem("cinenest_token", token);
    else localStorage.removeItem("cinenest_token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("cinenest_user", JSON.stringify(user));
    else localStorage.removeItem("cinenest_user");
  }, [user]);

  async function login(email, password) {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  async function register(name, email, password) {
    setLoading(true);
    try {
      const data = await api.register(name, email, password);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ token, user, loading, login, register, logout, isAdmin: user?.role === "admin" }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
