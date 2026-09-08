import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Stack,
  Typography,
  Button,
  Tabs,
  Tab,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useAuth } from "../contexts/AuthContext";
import AppNav from "../components/AppNav";
import Banner from "../components/Banner";
import ImageWithFallback from "../components/ImageWithFallback";
import {
  fetchMyListings,
  updateListingStatus,
  deleteListing,
  fetchSavedListings,
  unsaveListing,
} from "../services/listingService";
import { SETTABLE_STATUSES, STATUS_META } from "../utils/constants";

const STATUS_TABS = ["all", "available", "reserved", "sold"];
const TABS = [...STATUS_TABS, "saved"];
const TAB_LABELS = { all: "All", available: "Available", reserved: "Reserved", sold: "Sold", saved: "My Saved" };
const BANNER_AUTO_HIDE_MS = 6000;

export default function MyListings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [users, setUsers] = useState([]);
  const [buyerId, setBuyerId] = useState("");
  const [savingBuyer, setSavingBuyer] = useState(false);

  const [listings, setListings] = useState([]);
  const [savedListings, setSavedListings] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | ready | error
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState(TABS.includes(location.state?.tab) ? location.state.tab : "all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reload, setReload] = useState(0);
  const [banner, setBanner] = useState(location.state?.flash || null);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), BANNER_AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [banner]);

  const fetchPage = useCallback(
    (cursor) => fetchMyListings(user.token, { limit: 50, cursor: cursor || undefined }),
    [user.token],
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setPhase("loading");
      try {
        const [data, savedData] = await Promise.all([
          fetchPage(null),
          fetchSavedListings(user.token).catch(() => ({ listings: [] })),
        ]);
        if (cancelled) return;
        setListings(data.listings);
        setNextCursor(data.nextCursor);
        setSavedListings(savedData.listings);
        setPhase("ready");
      } catch {
        if (!cancelled) setPhase("error");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [fetchPage, reload, user.token]);

  // Load all users if any listing is sold (populates the buyer picker below)
  useEffect(() => {
    async function loadUsers() {
      const hasSold = listings.some((l) => l.status === "sold");
      if (!hasSold) return;

      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error("Failed to load users:", err);
      }
    }

    loadUsers();
  }, [listings, user.token]);

  async function loadMore() {
    if (nextCursor == null) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(nextCursor);
      setListings((prev) => [...prev, ...data.listings]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setBanner({ type: "error", message: err.message || "Couldn't load more listings. Try again." });
    } finally {
      setLoadingMore(false);
    }
  }

  async function updateBuyer(listingId, buyerId) {
    setSavingBuyer(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/listings/${listingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ buyerId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setBanner({
          type: "error",
          message: data.message || "Couldn't update buyer.",
        });
      } else {
        setListings((prev) =>
          prev.map((l) =>
            l.id === listingId ? { ...l, buyerId } : l
          )
        );
        setBanner({
          type: "success",
          message: "Buyer updated successfully.",
        });
      }
    } catch (err) {
      setBanner({
        type: "error",
        message: err.message || "Couldn't update buyer.",
      });
    }

    setSavingBuyer(false);
  }

  async function changeStatus(id, status) {
    setBusyId(id);
    try {
      await updateListingStatus(user.token, id, status);
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (err) {
      setBanner({ type: "error", message: err.message || "Couldn't update the status." });
    } finally {
      setBusyId(null);
    }
  }

  async function removeSaved(id) {
    setBusyId(id);
    try {
      await unsaveListing(user.token, id);
      setSavedListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setBanner({ type: "error", message: err.message || "Couldn't remove this listing." });
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    const id = deleteTarget?.id;
    const title = deleteTarget?.title;
    if (!id) return;
    setBusyId(id);
    try {
      await deleteListing(user.token, id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      setBanner({ type: "success", message: `“${title}” was deleted.` });
    } catch (err) {
      setBanner({ type: "error", message: err.message || "Couldn't delete this listing." });
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  }

  const counts = STATUS_TABS.reduce((acc, key) => {
    acc[key] = key === "all" ? listings.length : listings.filter((l) => l.status === key).length;
    return acc;
  }, {});
  counts.saved = savedListings.length;

  const byTab =
    tab === "saved" ? savedListings : tab === "all" ? listings : listings.filter((l) => l.status === tab);
  const q = search.trim().toLowerCase();
  const visible = q ? byTab.filter((l) => (l.title || "").toLowerCase().includes(q)) : byTab;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f2f2f2" }}>
      <AppNav active="my-listings" search={search} onSearchChange={setSearch} />
      <Banner type={banner?.type} message={banner?.message} onClose={() => setBanner(null)} />

      {phase === "loading" ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 2.5 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
            My Listings
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            onClick={() => navigate("/listings/new")}
            sx={{ textTransform: "none", bgcolor: "#1a1a1a", "&:hover": { bgcolor: "#333" } }}
          >
            + Post item
          </Button>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
        >
          {TABS.map((key) => (
            <Tab
              key={key}
              value={key}
              label={`${TAB_LABELS[key]} · ${counts[key]}`}
              sx={{ textTransform: "none" }}
            />
          ))}
        </Tabs>

        {phase === "error" && (
          <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
            <Typography color="text.secondary">Couldn’t load your listings.</Typography>
            <Button variant="contained" onClick={() => setReload((n) => n + 1)}>
              Retry
            </Button>
          </Stack>
        )}

        {phase === "ready" && visible.length === 0 && (
          <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
            <Typography color="text.secondary">
              {q
                ? `No listings match “${search.trim()}”.`
                : tab === "saved"
                  ? "You haven’t saved any listings yet."
                  : tab === "all"
                    ? "You haven’t posted any listings yet."
                    : `No ${tab} listings.`}
            </Typography>
            {tab === "all" && !q && (
              <Button variant="outlined" onClick={() => navigate("/listings/new")} sx={{ textTransform: "none" }}>
                Post your first item
              </Button>
            )}
          </Stack>
        )}

        {phase === "ready" &&
          visible.map((l) => (
            <Stack
              key={l.id}
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{
                p: 1.75,
                mb: 1.5,
                bgcolor: "#fff",
                border: 1,
                borderColor: "divider",
                borderRadius: 2.5,
                opacity: l.status === "sold" ? 0.7 : 1,
              }}
            >
              <Box
                onClick={() => navigate(`/listings/${l.id}`)}
                sx={{
                  width: 76,
                  height: 60,
                  flex: "none",
                  borderRadius: 2,
                  bgcolor: "#f2f2f2",
                  border: 1,
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                <ImageWithFallback
                  src={l.images?.[0]}
                  alt={l.title}
                  compact
                  width={160}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{ fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                  noWrap
                  onClick={() => navigate(`/listings/${l.id}`)}
                >
                  {l.title}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.4 }}>
                  ${l.price} · {l.category}
                </Typography>
              </Box>
              {l.status === "sold" && (
                <Box sx={{ minWidth: 180 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.5 }}>
                    Buyer
                  </Typography>

                  <Select
                    size="small"
                    value={l.buyerId || ""}
                    onChange={(e) => updateBuyer(l.id, e.target.value)}
                    disabled={savingBuyer}
                    displayEmpty
                    sx={{ width: "100%", bgcolor: "#fff" }}
                  >
                    <MenuItem value="">
                      <em>Select buyer…</em>
                    </MenuItem>

                    {users.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              )}

              {tab === "saved" ? (
                <IconButton
                  aria-label={`Remove ${l.title} from saved`}
                  disabled={busyId === l.id}
                  onClick={() => removeSaved(l.id)}
                >
                  <FavoriteIcon sx={{ color: "#1a1a1a" }} />
                </IconButton>
              ) : (
                <>
                  <Select
                    size="small"
                    value={SETTABLE_STATUSES.includes(l.status) ? l.status : ""}
                    displayEmpty
                    disabled={busyId === l.id}
                    onChange={(e) => changeStatus(l.id, e.target.value)}
                    sx={{ minWidth: 140, bgcolor: "#fff" }}
                    aria-label={`Status for ${l.title}`}
                  >
                    {!SETTABLE_STATUSES.includes(l.status) && (
                      <MenuItem value="" disabled>
                        {STATUS_META[l.status]?.label || l.status}
                      </MenuItem>
                    )}
                    {SETTABLE_STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {STATUS_META[s].label}
                      </MenuItem>
                    ))}
                  </Select>

                  <IconButton
                    aria-label={`Delete ${l.title}`}
                    disabled={busyId === l.id}
                    onClick={() => setDeleteTarget(l)}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </>
              )}
            </Stack>
          ))}

        {phase === "ready" && tab === "all" && nextCursor != null && (
          <Stack alignItems="center" sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={loadMore} disabled={loadingMore} sx={{ textTransform: "none" }}>
              {loadingMore ? "Loading…" : "Load more"}
            </Button>
          </Stack>
        )}
      </Container>
      )}

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete this listing?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            “{deleteTarget?.title}” will be removed from browse and search. This can’t be undone here.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" sx={{ textTransform: "none" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
