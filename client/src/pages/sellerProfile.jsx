import { useState, useEffect, lazy, Suspense } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  Avatar,
  Chip,
  Button,
  Rating,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useAuth } from "../contexts/AuthContext";
import AppNav from "../components/AppNav";
import Banner from "../components/Banner";
import { getUser } from "../services/userService";
import { fetchSellerReviews, createReview } from "../services/reviewService";
import { getListing, fetchListingsBy } from "../services/listingService";
import { createListingChannel } from "../services/chatService";
import { initials, timeAgo } from "../utils/format";

const ReviewPanel = lazy(() => import("../components/ReviewPanel"));

const BANNER_AUTO_HIDE_MS = 6000;

// "B00123456" -> "B00•••456"
function maskBannerId(bannerId) {
  if (!bannerId || bannerId.length < 6) return bannerId;
  return `${bannerId.slice(0, 3)}•••${bannerId.slice(-3)}`;
}

export default function SellerProfile() {
  const { sellerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Passed by whoever links here (e.g. the listing page's "View profile"), so we know
  // which purchase a review/message is about. Without it we degrade gracefully instead
  // of guessing.
  const listingId = location.state?.listingId;
  const listingTitle = location.state?.listingTitle;
  const isOwnProfile = user?.userId === sellerId;

  const [seller, setSeller] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | ready | notfound | error
  const [banner, setBanner] = useState(null);
  const [messaging, setMessaging] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewsPhase, setReviewsPhase] = useState("loading");

  // One review per listing — if you've already reviewed this specific purchase, the
  // fetched reviews list already contains it (reviewerId + listingId match).
  const myReview = reviews.find((r) => r.reviewerId === user.userId && r.listingId === listingId);

  const [soldCount, setSoldCount] = useState(null);

  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [postingReview, setPostingReview] = useState(false);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), BANNER_AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [banner]);

  useEffect(() => {
    if (user?.userId && sellerId === user.userId) {
      navigate("/profile", { replace: true });
    }
  }, [sellerId, user?.userId, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setPhase("loading");
      try {
        const data = await getUser(user.token, sellerId);
        if (!cancelled) {
          setSeller(data);
          setPhase("ready");
        }
      } catch (err) {
        if (!cancelled) setPhase(err.status === 404 ? "notfound" : "error");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [sellerId, user.token]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setReviewsPhase("loading");
      try {
        const data = await fetchSellerReviews(user.token, sellerId);
        if (!cancelled) {
          setReviews(data.reviews || []);
          setReviewsPhase("ready");
        }
      } catch {
        if (!cancelled) setReviewsPhase("error");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [sellerId, user.token]);

  // "Items sold" for the header stat — counts this seller's sold listings.
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const data = await fetchListingsBy(user.token, { sellerId, status: "sold" });
        if (!cancelled) setSoldCount(data.listings?.length ?? 0);
      } catch {
        // non-critical enhancement; leave blank on failure
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [sellerId, user.token]);

  // Review eligibility is tied to one specific (sold) listing you bought from this
  // seller, not "have you ever bought anything from them" in general.
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!listingId) {
        setEligibilityChecked(true);
        return;
      }
      try {
        const data = await getListing(user.token, listingId);
        const eligible = data.sellerId === sellerId && data.status === "sold" && data.buyerId === user.userId;
        if (!cancelled) {
          setHasPurchased(eligible);
          setEligibilityChecked(true);
        }
      } catch {
        if (!cancelled) setEligibilityChecked(true);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [listingId, sellerId, user.userId, user.token]);

  async function handleMessage() {
    if (!listingId) return;
    setMessaging(true);
    try {
      const data = await createListingChannel(user.token, listingId);
      navigate(`/messages?channel=${data.channelId}`);
    } catch (err) {
      setBanner({ type: "error", message: err.message || "Unable to start a conversation." });
    } finally {
      setMessaging(false);
    }
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (myReview) return;
    setReviewSubmitted(true);

    if (!rating) return;

    setPostingReview(true);
    try {
      const data = await createReview(user.token, { sellerId, listingId, rating, comment: reviewText.trim() });
      setReviews((prev) => [data, ...prev]);
      setRating(0);
      setReviewText("");
      setReviewSubmitted(false);
      setBanner({ type: "success", message: "Review posted." });
    } catch (err) {
      setBanner({ type: "error", message: err.message || "Couldn't post your review." });
    } finally {
      setPostingReview(false);
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
              <Typography color="text.secondary">This seller doesn&rsquo;t exist.</Typography>
              <Button variant="contained" onClick={() => navigate("/dashboard")}>
                Back to browse
              </Button>
            </Stack>
          )}
          {phase === "error" && (
            <Stack alignItems="center" spacing={2}>
              <Typography color="text.secondary">Couldn&rsquo;t load this profile.</Typography>
              <Button variant="contained" onClick={() => navigate(0)}>
                Retry
              </Button>
            </Stack>
          )}
        </Box>
      </Box>
    );
  }

  const joined = seller.createdAt
    ? new Date(seller.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f2f2f2" }}>
      <AppNav />
      <Banner type={banner?.type} message={banner?.message} onClose={() => setBanner(null)} />

      <Container maxWidth="md" sx={{ py: 4, maxWidth: 880 }}>
        <Paper variant="outlined" sx={{ p: 2.75, borderRadius: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={2.5} flexWrap="wrap" rowGap={2}>
            <Avatar
              src={seller.avatarUrl || undefined}
              sx={{ width: 72, height: 72, bgcolor: "#f2f2f2", color: "#4d4d4d", fontSize: 22, flexShrink: 0 }}
            >
              {initials(seller.name)}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 220 }}>
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" rowGap={0.5}>
                <Typography sx={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.4px" }}>
                  {seller.name}
                </Typography>
                {seller.emailVerified && (
                  <Chip
                    icon={<VerifiedIcon />}
                    label="Verified Dal student"
                    size="small"
                    sx={{ bgcolor: "#ededed" }}
                  />
                )}
              </Stack>
              <Typography sx={{ fontSize: 13, color: "#808080", mt: 0.75 }}>
                {maskBannerId(seller.bannerId)}
                {joined ? ` · Joined ${joined}` : ""} · {soldCount === null ? "—" : soldCount} item
                {soldCount === 1 ? "" : "s"} sold
              </Typography>
            </Box>

            {!isOwnProfile && (
              <Tooltip title={listingId ? "" : "Visit one of their listings to start a conversation."}>
                <span>
                  <Button
                    variant="outlined"
                    onClick={handleMessage}
                    disabled={!listingId || messaging}
                    sx={{ height: 42, textTransform: "none", color: "#1a1a1a", borderColor: "#cfcfcf" }}
                  >
                    {messaging ? "Starting…" : "Message"}
                  </Button>
                </span>
              </Tooltip>
            )}
          </Stack>
        </Paper>

        <Stack direction={{ xs: "column", md: "row" }} spacing={3.5} alignItems="flex-start" sx={{ mt: 3.5 }}>
          <Box sx={{ flex: 1.05, width: "100%" }}>
            <Paper variant="outlined" sx={{ p: 2.75, borderRadius: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={1.75}>
                <Typography sx={{ fontSize: 40, fontWeight: 700, letterSpacing: "-1px", lineHeight: 1 }}>
                  {(seller.ratingAvg || 0).toFixed(1)}
                </Typography>
                <Box>
                  <Rating
                    value={seller.ratingAvg || 0}
                    precision={0.1}
                    readOnly
                    sx={{ color: "#1a1a1a", "& .MuiRating-iconEmpty": { color: "#cfcfcf" } }}
                  />
                  <Typography sx={{ fontSize: 13, color: "#808080", mt: 0.5 }}>
                    Based on {seller.ratingCount || 0} review{seller.ratingCount === 1 ? "" : "s"}
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ height: 1, bgcolor: "divider", my: 2.25 }} />

              {reviewsPhase === "loading" && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              {reviewsPhase === "error" && (
                <Typography sx={{ fontSize: 14, color: "text.secondary" }}>Couldn&rsquo;t load reviews.</Typography>
              )}
              {reviewsPhase === "ready" && reviews.length === 0 && (
                <Typography sx={{ fontSize: 14, color: "text.secondary" }}>No reviews yet.</Typography>
              )}
              {reviewsPhase === "ready" &&
                reviews.map((r, i) => (
                  <Box
                    key={r.id}
                    sx={{ py: 2.25, borderBottom: i === reviews.length - 1 ? 0 : 1, borderColor: "divider" }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.375} sx={{ mb: 1 }}>
                      <Avatar
                        sx={{ width: 38, height: 38, bgcolor: "#f2f2f2", color: "#4d4d4d", fontSize: 13, flexShrink: 0 }}
                      >
                        {initials(r.reviewerName)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{r.reviewerName}</Typography>
                        <Rating value={r.rating} readOnly size="small" sx={{ color: "#1a1a1a" }} />
                      </Box>
                      <Box sx={{ flexGrow: 1 }} />
                      <Typography sx={{ fontSize: 12, color: "#a6a6a6", whiteSpace: "nowrap" }}>
                        {timeAgo(r.createdAt)}
                      </Typography>
                    </Stack>
                    {r.comment && (
                      <Typography sx={{ fontSize: 14, color: "#4d4d4d", lineHeight: 1.5 }}>{r.comment}</Typography>
                    )}
                  </Box>
                ))}
            </Paper>
          </Box>

          {!isOwnProfile && (
            <Box sx={{ flex: 0.95, width: "100%" }}>
              <Paper variant="outlined" sx={{ p: 2.75, borderRadius: 2.5 }}>
                <Suspense
                  fallback={
                    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                      <CircularProgress size={22} />
                    </Box>
                  }
                >
                  <ReviewPanel
                    eligibilityChecked={eligibilityChecked}
                    hasPurchased={hasPurchased}
                    listingId={listingId}
                    listingTitle={listingTitle}
                    myReview={myReview}
                    rating={rating}
                    setRating={setRating}
                    reviewText={reviewText}
                    setReviewText={setReviewText}
                    reviewSubmitted={reviewSubmitted}
                    postingReview={postingReview}
                    onSubmit={handleSubmitReview}
                  />
                </Suspense>
              </Paper>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
