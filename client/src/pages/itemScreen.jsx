import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Stack,
  Typography,
  Chip,
  Button,
  Link,
  CircularProgress,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useAuth } from "../contexts/AuthContext";
import AppNav from "../components/AppNav";
import ImageGallery from "../components/ImageGallery";
import AiSummaryCard from "../components/AiSummaryCard";
import SellerCard from "../components/SellerCard";
import { getListing, fetchSavedListings, saveListing, unsaveListing } from "../services/listingService";
import { createListingChannel } from "../services/chatService";
import { timeAgo } from "../utils/format";

const STATUS_LABELS = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  draft: "Draft",
};

function AttributeRow({ label, value, divider = true }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      sx={{ py: 1.25, borderBottom: divider ? 1 : 0, borderColor: "divider" }}
    >
      <Typography sx={{ color: "text.secondary", fontSize: 14, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 600, fontSize: 14, textAlign: "right" }}>
        {value}
      </Typography>
    </Stack>
  );
}

export default function ItemScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [saved, setSaved] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [phase, setPhase] = useState("loading"); // loading | ready | notfound | error

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setPhase("loading");
      try {
        const [data, savedData] = await Promise.all([
          getListing(user.token, id),
          fetchSavedListings(user.token).catch(() => ({ listings: [] })),
        ]);
        if (!cancelled) {
          setListing(data);
          setSaved(savedData.listings.some((l) => l.id === id));
          setPhase("ready");
        }
      } catch (err) {
        if (!cancelled) setPhase(err.status === 404 ? "notfound" : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, user.token]);

  async function toggleSaved() {
    setSavingFavorite(true);
    try {
      if (saved) {
        await unsaveListing(user.token, id);
      } else {
        await saveListing(user.token, id);
      }
      setSaved((s) => !s);
    } catch {
      // keep prior saved state; the button remains available to retry
    } finally {
      setSavingFavorite(false);
    }
  }

  if (phase !== "ready") {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f2f2f2" }}>
        <AppNav />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          {phase === "loading" && <CircularProgress />}
          {phase === "notfound" && (
            <Stack alignItems="center" spacing={2}>
              <Typography color="text.secondary">
                This listing doesn&rsquo;t exist or was removed.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/dashboard")}
              >
                Back to browse
              </Button>
            </Stack>
          )}
          {phase === "error" && (
            <Stack alignItems="center" spacing={2}>
              <Typography color="text.secondary">
                Something went wrong loading this listing.
              </Typography>
              <Button variant="contained" onClick={() => navigate(0)}>
                Retry
              </Button>
            </Stack>
          )}
        </Box>
      </Box>
    );
  }

  const isOwner = user?.userId && user.userId === listing.sellerId;

  async function handleMessageSeller() {
    try {
      const data = await createListingChannel(user.token, listing.id);
      navigate(`/messages?channel=${data.channelId}`);
    } catch (error) {
      console.error("Message seller error:", error);
      alert(error.message || "Unable to start a conversation.");
    }
  }
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f2f2f2" }}>
      <AppNav />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          <Link
            component="button"
            underline="hover"
            color="inherit"
            onClick={() => navigate("/dashboard")}
          >
            Browse
          </Link>{" "}
          › {listing.category} › {listing.title}
        </Typography>

        <Grid container spacing={4.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ImageGallery images={listing.images} alt={listing.title} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Chip
              label={STATUS_LABELS[listing.status] || listing.status}
              size="small"
              variant="outlined"
              sx={{ bgcolor: "#f0f0f0" }}
            />
            <Typography
              variant="h5"
              component="h1"
              sx={{ fontWeight: 700, mt: 1.5, mb: 0.5 }}
            >
              {listing.title}
            </Typography>
            <Typography
              component="p"
              aria-label={`Price ${listing.price} dollars`}
              sx={{
                fontSize: 28,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              ${listing.price}
            </Typography>

            <AiSummaryCard summary={listing.aiSummary} />

            {listing.description && (
              <Box sx={{ mt: 2.5 }}>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    mb: 0.75,
                  }}
                >
                  Seller&rsquo;s description
                </Typography>
                <Typography
                  sx={{
                    color: "#4d4d4d",
                    fontSize: 14,
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {listing.description}
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 2.5 }}>
              <AttributeRow label="Category" value={listing.category} />
              <AttributeRow label="Condition" value={listing.condition} />
              <AttributeRow label="Region" value={listing.region} />
              <AttributeRow
                label="Posted"
                value={timeAgo(listing.createdAt)}
                divider={false}
              />
            </Box>

            <SellerCard
              name={listing.sellerName}
              ratingAvg={listing.sellerRatingAvg || 0}
              ratingCount={listing.sellerRatingCount || 0}
              onViewProfile={() =>
                navigate(`/users/${listing.sellerId}`, {
                  state: { listingId: listing.id, listingTitle: listing.title },
                })
              }
            />

            {isOwner ? (
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate(`/listings/${listing.id}/edit`)}
                sx={{
                  height: 44,
                  textTransform: "none",
                  bgcolor: "#1a1a1a",
                  "&:hover": { bgcolor: "#333" },
                }}
              >
                Edit listing
              </Button>
            ) : (
              <>
                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="contained"
                    onClick={handleMessageSeller}
                    sx={{
                      flex: 1,
                      height: 44,
                      textTransform: "none",
                      bgcolor: "#1a1a1a",
                      "&:hover": { bgcolor: "#333" },
                    }}
                  >
                    Message seller
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={savingFavorite}
                    onClick={toggleSaved}
                    startIcon={
                      saved ? <FavoriteIcon /> : <FavoriteBorderIcon />
                    }
                    sx={{
                      flexShrink: 0,
                      height: 44,
                      textTransform: "none",
                      color: "#1a1a1a",
                      borderColor: "#cfcfcf",
                    }}
                  >
                    {saved ? "Saved" : "Save"}
                  </Button>
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", textAlign: "center", mt: 1.5 }}
                >
                  Your contact details stay private — chat happens inside
                  DalMarketplace.
                </Typography>
              </>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
