import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/navbar.module.css";

function getInitials(name) {
  if (!name) return "SM";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const path = location.pathname;
  const [search, setSearch] = useState("");

  function handleSearchKey(e) {
    if (e.key === "Enter" && search.trim()) {
      navigate(`/dashboard?q=${encodeURIComponent(search.trim())}`);
    }
  }

  const linkClass = (to) =>
    path === to || path.startsWith(to + "/")
      ? `${styles.navLink} ${styles.navLinkActive}`
      : styles.navLink;

  return (
    <nav className={styles.navbar}>
      <Link to="/dashboard" className={styles.brand}>
        <div className={styles.brandMark}>DM</div>
        <div className={styles.brandName}>DalMarketplace</div>
      </Link>

      <div className={styles.search}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#808080"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Search desks, monitors, sublets..."
          aria-label="Search desks, monitors, sublets"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKey}
        />
      </div>

      <div className={styles.navActions}>
        <Link to="/help" className={linkClass("/help")}>
          Help
        </Link>
        <Link to="/dashboard" className={linkClass("/dashboard")}>
          Browse
        </Link>
        <Link to="/messages" className={linkClass("/messages")}>
          Messages
        </Link>
        <Link to="/my-listings" className={linkClass("/my-listings")}>
          My Listings
        </Link>
        <Link to="/listings/new" className={styles.postButton}>
          + Post item
        </Link>
        <Link to="/profile" className={styles.avatar} aria-label="Profile">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            getInitials(user?.name)
          )}
        </Link>
      </div>
    </nav>
  );
}
