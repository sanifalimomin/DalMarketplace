import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Stack, Typography, Button, CircularProgress } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import AppNav from "../components/AppNav";
import ImageWithFallback from "../components/ImageWithFallback";
import { fetchListingsBy } from "../services/listingService";

// Lets a buyer find items they've bought (once the seller marks them sold and
// assigns them as the buyer) and jump straight to leaving a review — without
// needing to remember which listing page to go back to.
export default function MyPurchases() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [phase, setPhase] = useState("loading"); // loading | ready | error
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setPhase("loading");
      try {
        const data = await fetchListingsBy(user.token, { buyerId: user.userId, status: "sold" });
        if (!cancelled) {
          setListings(data.listings);
          setPhase("ready");
        }
      } catch {
        if (!cancelled) setPhase("error");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [user.token, user.userId, reload]);

  function goToSeller(l) {
    navigate(`/users/${l.sellerId}`, { state: { listingId: l.id, listingTitle: l.title } });
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f2f2f2" }}>
      <AppNav active="my-purchases" />

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
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 2.5 }}>
            My Purchases
          </Typography>

          {phase === "error" && (
            <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
              <Typography color="text.secondary">Couldn&rsquo;t load your purchases.</Typography>
              <Button variant="contained" onClick={() => setReload((n) => n + 1)}>
                Retry
              </Button>
            </Stack>
          )}

          {phase === "ready" && listings.length === 0 && (
            <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
              <Typography color="text.secondary" sx={{ textAlign: "center", maxWidth: 360 }}>
                Nothing here yet — items you&rsquo;ve bought will show up once the seller marks them sold.
              </Typography>
              <Button variant="outlined" onClick={() => navigate("/dashboard")} sx={{ textTransform: "none" }}>
                Browse listings
              </Button>
            </Stack>
          )}

          {phase === "ready" &&
            listings.map((l) => (
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
                    ${l.price} · Sold by {l.sellerName}
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  onClick={() => goToSeller(l)}
                  sx={{ textTransform: "none", color: "#1a1a1a", borderColor: "#cfcfcf", flexShrink: 0 }}
                >
                  Leave a review
                </Button>
              </Stack>
            ))}
        </Container>
      )}
    </Box>
  );
}
