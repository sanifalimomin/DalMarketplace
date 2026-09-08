import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Stack,
  Typography,
  Select,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import AppNav from "../components/AppNav";
import FilterSidebar from "../components/FilterSidebar";
import ListingCard from "../components/ListingCard";
import { browseListings } from "../services/listingService";
import { SORT_OPTIONS } from "../utils/constants";

const PAGE_SIZE = 12;
const EMPTY_FILTERS = {
  q: "",
  category: "",
  region: "",
  condition: "",
  minPrice: "",
  maxPrice: "",
  sort: "recent",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(initialQ);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, q: initialQ });
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [nextOffset, setNextOffset] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | ready | error
  const [loadingMore, setLoadingMore] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.q === searchInput ? f : { ...f, q: searchInput }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchPage = useCallback(
    (offset) => browseListings(user.token, { ...filters, limit: PAGE_SIZE, offset: offset || undefined }),
    [filters, user.token],
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setPhase("loading");
      try {
        const data = await fetchPage(0);
        if (cancelled) return;
        setListings(data.listings);
        setTotal(data.total);
        setNextOffset(data.nextOffset);
        setPhase("ready");
      } catch {
        if (!cancelled) setPhase("error");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [fetchPage, reload]);

  async function loadMore() {
    if (nextOffset == null) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(nextOffset);
      setListings((prev) => [...prev, ...data.listings]);
      setNextOffset(data.nextOffset);
    } catch {
      /* keep current results; Load more stays available to retry */
    } finally {
      setLoadingMore(false);
    }
  }

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function clearFilters() {
    setSearchInput("");
    setFilters(EMPTY_FILTERS);
  }

  function clearChip(key) {
    if (key === "price") {
      setFilters((f) => ({ ...f, minPrice: "", maxPrice: "" }));
    } else {
      updateFilter(key, "");
    }
  }

  const activeChips = [];
  if (filters.category) activeChips.push({ key: "category", label: filters.category });
  if (filters.region) activeChips.push({ key: "region", label: filters.region });
  if (filters.condition) activeChips.push({ key: "condition", label: filters.condition });
  if (filters.minPrice || filters.maxPrice) {
    activeChips.push({
      key: "price",
      label: `$${filters.minPrice || 0} – $${filters.maxPrice || "∞"}`,
    });
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f2f2f2" }}>
      <AppNav active="browse" search={searchInput} onSearchChange={setSearchInput} />

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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3.5} alignItems="flex-start">
          <FilterSidebar filters={filters} onChange={updateFilter} onClear={clearFilters} />

          <Box sx={{ flex: 1, width: "100%" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                rowGap: 1.5,
                columnGap: 1.5,
                mb: 2.5,
                width: "100%",
              }}
            >
              <Typography component="h1" sx={{ fontSize: 19, fontWeight: 600, m: 0, lineHeight: 1.4 }}>
                {filters.q ? `Results for “${filters.q}”` : "Browse listings"}
              </Typography>
              {phase === "ready" && (
                <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: 1.4 }}>
                  · {total} item{total === 1 ? "" : "s"}
                  {filters.region ? ` in ${filters.region}` : ""}
                </Typography>
              )}

              <Box sx={{ flexGrow: 1 }} />

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.4 }}>Sort</Typography>
                <Select
                  size="small"
                  value={filters.sort}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                  sx={{ bgcolor: "#fff" }}
                  aria-label="Sort listings"
                >
                  {SORT_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>

            {activeChips.length > 0 && (
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 2.5, rowGap: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mr: 0.5 }}>Active Filters</Typography>
                {activeChips.map((c) => (
                  <Chip
                    key={c.key}
                    label={c.label}
                    size="small"
                    onDelete={() => clearChip(c.key)}
                    sx={{ bgcolor: "#ededed" }}
                  />
                ))}
              </Stack>
            )}

            {phase === "error" && (
              <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
                <Typography color="text.secondary">Couldn’t load listings.</Typography>
                <Button variant="contained" onClick={() => setReload((n) => n + 1)}>
                  Retry
                </Button>
              </Stack>
            )}

            {phase === "ready" && listings.length === 0 && (
              <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
                <Typography color="text.secondary">No listings match your search.</Typography>
                <Button variant="outlined" onClick={clearFilters} sx={{ textTransform: "none" }}>
                  Clear filters
                </Button>
              </Stack>
            )}

            {phase === "ready" && listings.length > 0 && (
              <>
                <Grid container spacing={2.5}>
                  {listings.map((l) => (
                    <Grid key={l.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <ListingCard listing={l} />
                    </Grid>
                  ))}
                </Grid>

                {nextOffset != null && (
                  <Stack alignItems="center" sx={{ mt: 4 }}>
                    <Button
                      variant="outlined"
                      onClick={loadMore}
                      disabled={loadingMore}
                      sx={{ textTransform: "none" }}
                    >
                      {loadingMore ? "Loading…" : "Load more"}
                    </Button>
                  </Stack>
                )}
              </>
            )}
          </Box>
        </Stack>
      </Container>
      )}
    </Box>
  );
}
