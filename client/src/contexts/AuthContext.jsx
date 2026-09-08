import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const bannerId = localStorage.getItem("bannerId");
    const userId = localStorage.getItem("userId");
    const name = localStorage.getItem("name");
    const avatarUrl = localStorage.getItem("avatarUrl");
    if (token && bannerId) {
      setUser({ token, bannerId, userId, name, avatarUrl });
    }
    setLoading(false);
  }, []);

  function signIn(token, bannerId, userId, name, avatarUrl) {
    localStorage.setItem("token", token);
    localStorage.setItem("bannerId", bannerId);
    localStorage.setItem("userId", userId);
    localStorage.setItem("name", name);
    if (avatarUrl) localStorage.setItem("avatarUrl", avatarUrl);
    else localStorage.removeItem("avatarUrl");
    setUser({ token, bannerId, userId, name, avatarUrl: avatarUrl || null });
  }

  function signUp(token, bannerId, userId) {
    localStorage.setItem("token", token);
    localStorage.setItem("bannerId", bannerId);
    localStorage.setItem("userId", userId);
    setUser({ token, bannerId, userId });
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("bannerId");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    localStorage.removeItem("avatarUrl");
    setUser(null);
  }

  function updateUser(updates) {
    if (updates.name !== undefined) localStorage.setItem("name", updates.name);
    if (updates.avatarUrl !== undefined) {
      if (updates.avatarUrl) localStorage.setItem("avatarUrl", updates.avatarUrl);
      else localStorage.removeItem("avatarUrl");
    }
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}