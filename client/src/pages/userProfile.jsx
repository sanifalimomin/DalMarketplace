import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  Avatar,
  Chip,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Rating,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VerifiedIcon from "@mui/icons-material/Verified";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../contexts/AuthContext";
import AppNav from "../components/AppNav";
import Banner from "../components/Banner";
import { getMe, updateMe, changePassword } from "../services/userService";
import { fetchMyListings, fetchSavedListings } from "../services/listingService";
import { fetchSellerReviews } from "../services/reviewService";
import { uploadImage } from "../services/cloudinaryService";
import { initials, timeAgo } from "../utils/format";

const BANNER_AUTO_HIDE_MS = 6000;

// Label/value row used in the Account card — mirrors ItemScreen's AttributeRow.
function InfoRow({ label, value, divider = true }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      sx={{ py: 1.25, borderBottom: divider ? 1 : 0, borderColor: "divider" }}
    >
      <Typography sx={{ color: "text.secondary", fontSize: 14, flexShrink: 0 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 600, fontSize: 14, textAlign: "right" }}>{value}</Typography>
    </Stack>
  );
}

export default function UserProfile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | ready | error
  const [reload, setReload] = useState(0);
  const [banner, setBanner] = useState(null);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [listingCount, setListingCount] = useState(null);
  const [listingCountHasMore, setListingCountHasMore] = useState(false);
  const [savedCount, setSavedCount] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewsPhase, setReviewsPhase] = useState("loading");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), BANNER_AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [banner]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setPhase("loading");
      try {
        const data = await getMe(user.token);
        if (cancelled) return;
        setProfile(data);
        setNameDraft(data.name || "");
        updateUser({ name: data.name, avatarUrl: data.avatarUrl || null });
        setPhase("ready");
      } catch {
        if (!cancelled) setPhase("error");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [user.token, reload]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const [listingsData, savedData] = await Promise.all([
          fetchMyListings(user.token, { limit: 50 }),
          fetchSavedListings(user.token),
        ]);
        if (cancelled) return;
        setListingCount(listingsData.listings.length);
        setListingCountHasMore(Boolean(listingsData.nextCursor));
        setSavedCount(savedData.listings.length);
      } catch {
        // counts are a non-critical enhancement; leave them blank on failure
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [user.token]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setReviewsPhase("loading");
      try {
        const data = await fetchSellerReviews(user.token, user.userId, { limit: 10 });
        if (cancelled) return;
        setReviews(data.reviews);
        setReviewsPhase("ready");
      } catch {
        if (!cancelled) setReviewsPhase("error");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [user.token, user.userId]);

  function startEditName() {
    setNameDraft(profile.name || "");
    setEditingName(true);
  }

  async function saveName() {
    const name = nameDraft.trim();
    if (!name) {
      setBanner({ type: "error", message: "Name can't be empty." });
      return;
    }
    setSavingName(true);
    try {
      await updateMe(user.token, { name });
      setProfile((p) => ({ ...p, name }));
      updateUser({ name });
      setEditingName(false);
      setBanner({ type: "success", message: "Name updated." });
    } catch (err) {
      setBanner({ type: "error", message: err.message || "Couldn't update name." });
    } finally {
      setSavingName(false);
    }
  }

  async function handleAvatarSelected(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file);
      await updateMe(user.token, { avatarUrl: url });
      setProfile((p) => ({ ...p, avatarUrl: url }));
      updateUser({ avatarUrl: url });
      setBanner({ type: "success", message: "Profile photo updated." });
    } catch (err) {
      setBanner({ type: "error", message: err.message || "Couldn't upload photo." });
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/signin");
  }

  function handlePasswordFieldChange(e) {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  }

  const isNewPasswordValid = passwordForm.newPassword.length >= 8;
  const doNewPasswordsMatch =
    passwordForm.confirmNewPassword.length > 0 && passwordForm.confirmNewPassword === passwordForm.newPassword;

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordSubmitted(true);

    if (!passwordForm.currentPassword || !isNewPasswordValid || !doNewPasswordsMatch) {
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(user.token, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setPasswordSubmitted(false);
      setBanner({ type: "success", message: "Password updated." });
    } catch (err) {
      setBanner({ type: "error", message: err.message || "Couldn't update password." });
    } finally {
      setChangingPassword(false);
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
          {phase === "error" && (
            <Stack alignItems="center" spacing={2}>
              <Typography color="text.secondary">Couldn&rsquo;t load your profile.</Typography>
              <Button variant="contained" onClick={() => setReload((n) => n + 1)}>
                Retry
              </Button>
            </Stack>
          )}
        </Box>
      </Box>
    );
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f2f2f2" }}>
      <AppNav />
      <Banner type={banner?.type} message={banner?.message} onClose={() => setBanner(null)} />

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, mb: 2.5 }}>
          <Stack direction="row" spacing={2.5} alignItems="center">
            <Box sx={{ position: "relative", flexShrink: 0 }}>
              <Avatar
                src={profile.avatarUrl || undefined}
                sx={{ width: 72, height: 72, bgcolor: "#f2f2f2", color: "#4d4d4d", fontSize: 22 }}
              >
                {initials(profile.name)}
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarSelected}
              />
              <IconButton
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label="Change profile photo"
                sx={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  bgcolor: "#1a1a1a",
                  color: "#fff",
                  width: 28,
                  height: 28,
                  "&:hover": { bgcolor: "#333" },
                }}
              >
                {uploadingAvatar ? (
                  <CircularProgress size={14} sx={{ color: "#fff" }} />
                ) : (
                  <CameraAltIcon sx={{ fontSize: 15 }} />
                )}
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              {editingName ? (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <TextField
                    size="small"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    autoFocus
                    inputProps={{ "aria-label": "Name" }}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    onClick={saveName}
                    disabled={savingName}
                    sx={{ bgcolor: "#1a1a1a", "&:hover": { bgcolor: "#333" } }}
                  >
                    {savingName ? "Saving…" : "Save"}
                  </Button>
                  <Button size="small" onClick={() => setEditingName(false)} disabled={savingName}>
                    Cancel
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {profile.name}
                  </Typography>
                  <IconButton size="small" onClick={startEditName} aria-label="Edit name">
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
              )}

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.5, rowGap: 0.5 }}>
                <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{profile.bannerId}</Typography>
                {profile.emailVerified && (
                  <Chip icon={<VerifiedIcon />} label="Verified Dal" size="small" sx={{ bgcolor: "#ededed" }} />
                )}
              </Stack>

              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
                <Rating
                  value={profile.ratingAvg || 0}
                  precision={0.1}
                  readOnly
                  size="small"
                  sx={{ color: "#1a1a1a", "& .MuiRating-iconEmpty": { color: "#cfcfcf" } }}
                />
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  {profile.ratingCount > 0
                    ? `${(profile.ratingAvg || 0).toFixed(1)} · ${profile.ratingCount} review${profile.ratingCount === 1 ? "" : "s"}`
                    : "No reviews yet"}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, mb: 2.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4d4d4d", mb: 0.5 }}>Account</Typography>
          <Box>
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Banner ID" value={profile.bannerId} divider={Boolean(memberSince)} />
            {memberSince && <InfoRow label="Member since" value={memberSince} divider={false} />}
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, mb: 2.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4d4d4d", mb: 2 }}>Change password</Typography>
          <Box component="form" onSubmit={handleChangePassword}>
            <Stack spacing={2}>
              <Box>
                <Typography sx={{ fontSize: 13, color: "#4d4d4d", mb: 0.75 }}>Current password</Typography>
                <Box sx={{ position: "relative" }}>
                  <TextField
                    fullWidth
                    size="small"
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordFieldChange}
                    inputProps={{ "aria-label": "Current password" }}
                    sx={{ "& .MuiInputBase-input": { pr: 5 } }}
                  />
                  <IconButton
                    type="button"
                    size="small"
                    onClick={() => setShowCurrentPassword((s) => !s)}
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                    sx={{ position: "absolute !important", right: 4, top: "50%", transform: "translateY(-50%)", color: "#808080" }}
                  >
                    {showCurrentPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </Box>
                {passwordSubmitted && !passwordForm.currentPassword && (
                  <Typography sx={{ fontSize: 12, color: "#b3322b", mt: 0.5 }}>Current password is required.</Typography>
                )}
              </Box>

              <Box>
                <Typography sx={{ fontSize: 13, color: "#4d4d4d", mb: 0.75 }}>New password</Typography>
                <Box sx={{ position: "relative" }}>
                  <TextField
                    fullWidth
                    size="small"
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordFieldChange}
                    inputProps={{ "aria-label": "New password" }}
                    sx={{ "& .MuiInputBase-input": { pr: 5 } }}
                  />
                  <IconButton
                    type="button"
                    size="small"
                    onClick={() => setShowNewPassword((s) => !s)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                    sx={{ position: "absolute !important", right: 4, top: "50%", transform: "translateY(-50%)", color: "#808080" }}
                  >
                    {showNewPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </Box>
                {passwordSubmitted && !isNewPasswordValid && (
                  <Typography sx={{ fontSize: 12, color: "#b3322b", mt: 0.5 }}>
                    Password must be at least 8 characters.
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography sx={{ fontSize: 13, color: "#4d4d4d", mb: 0.75 }}>Confirm new password</Typography>
                <Box sx={{ position: "relative" }}>
                  <TextField
                    fullWidth
                    size="small"
                    type={showConfirmNewPassword ? "text" : "password"}
                    name="confirmNewPassword"
                    value={passwordForm.confirmNewPassword}
                    onChange={handlePasswordFieldChange}
                    inputProps={{ "aria-label": "Confirm new password" }}
                    sx={{ "& .MuiInputBase-input": { pr: 5 } }}
                  />
                  <IconButton
                    type="button"
                    size="small"
                    onClick={() => setShowConfirmNewPassword((s) => !s)}
                    aria-label={showConfirmNewPassword ? "Hide password" : "Show password"}
                    sx={{ position: "absolute !important", right: 4, top: "50%", transform: "translateY(-50%)", color: "#808080" }}
                  >
                    {showConfirmNewPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </Box>
                {passwordSubmitted && !doNewPasswordsMatch && (
                  <Typography sx={{ fontSize: 12, color: "#b3322b", mt: 0.5 }}>Passwords must match.</Typography>
                )}
              </Box>

              <Box>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={changingPassword}
                  sx={{ bgcolor: "#1a1a1a", "&:hover": { bgcolor: "#333" }, textTransform: "none" }}
                >
                  {changingPassword && <CircularProgress size={16} sx={{ color: "#fff", mr: 1.25 }} />}
                  {changingPassword ? "Updating…" : "Update password"}
                </Button>
              </Box>
            </Stack>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, mb: 2.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4d4d4d", mb: 1.5 }}>Activity</Typography>
          <Stack direction="row" spacing={2}>
            <Box
              component="button"
              type="button"
              onClick={() => navigate("/my-listings")}
              sx={{
                flex: 1,
                textAlign: "left",
                cursor: "pointer",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                p: 1.5,
                bgcolor: "transparent",
                font: "inherit",
              }}
            >
              <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
                {listingCount === null ? "—" : `${listingCount}${listingCountHasMore ? "+" : ""}`}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Active listings</Typography>
            </Box>
            <Box
              component="button"
              type="button"
              onClick={() => navigate("/my-listings", { state: { tab: "saved" } })}
              sx={{
                flex: 1,
                textAlign: "left",
                cursor: "pointer",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                p: 1.5,
                bgcolor: "transparent",
                font: "inherit",
              }}
            >
              <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
                {savedCount === null ? "—" : savedCount}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Saved listings</Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, mb: 2.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4d4d4d", mb: 1.5 }}>
            Reviews you&rsquo;ve received
          </Typography>
          {reviewsPhase === "loading" && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={22} />
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
              <Box key={r.id} sx={{ py: 1.25, borderTop: i === 0 ? 0 : 1, borderColor: "divider" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{r.reviewerName}</Typography>
                  <Rating value={r.rating} readOnly size="small" sx={{ color: "#1a1a1a" }} />
                </Stack>
                {r.comment && (
                  <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }}>{r.comment}</Typography>
                )}
                <Typography sx={{ fontSize: 11, color: "#a6a6a6", mt: 0.5 }}>{timeAgo(r.createdAt)}</Typography>
              </Box>
            ))}
        </Paper>

        <Button
          variant="outlined"
          color="error"
          onClick={handleLogout}
          sx={{ textTransform: "none" }}
        >
          Log out
        </Button>
      </Container>
    </Box>
  );
}
