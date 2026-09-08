import { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  Button,
  Divider,
  IconButton,
  CircularProgress,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { useAuth } from "../contexts/AuthContext";
import AppNav from "../components/AppNav";
import Banner from "../components/Banner";
import { uploadImages } from "../services/cloudinaryService";
import { createListing, updateListing, getListing } from "../services/listingService";
import { CATEGORIES, CONDITIONS, REGIONS, MAX_IMAGES, DESCRIPTION_MIN_LENGTH } from "../utils/constants";

const BANNER_AUTO_HIDE_MS = 6000;

function FieldHint({ state, text }) {
  if (!state) return null;
  const isGood = state === "good";
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        fontSize: 12,
        color: isGood ? "#2f6b35" : "#b3322b",
        mt: 0.75,
      }}
    >
      {isGood ? <CheckIcon sx={{ fontSize: 14 }} /> : <CloseIcon sx={{ fontSize: 14 }} />}
      {text}
    </Box>
  );
}

export default function NewPosting() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "",
    condition: "",
    region: "",
    description: "",
  });
  const [banner, setBanner] = useState(null); // { type: "success" | "error", message } | null
  const [loading, setLoading] = useState(null); // null | "draft" | "published" | "saving"
  const [loadPhase, setLoadPhase] = useState(isEdit ? "loading" : "ready"); // loading | ready | error

  const previews = useMemo(() => images.map((file) => URL.createObjectURL(file)), [images]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), BANNER_AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [banner]);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    async function load() {
      setLoadPhase("loading");
      try {
        const listing = await getListing(user.token, id);
        if (cancelled) return;
        if (listing.sellerId !== user.userId) {
          navigate(`/listings/${id}`, { replace: true });
          return;
        }
        setFormData({
          title: listing.title || "",
          price: listing.price ?? "",
          category: listing.category || "",
          condition: listing.condition || "",
          region: listing.region || "",
          description: listing.description || "",
        });
        setExistingImages(listing.images || []);
        setLoadPhase("ready");
      } catch {
        if (!cancelled) setLoadPhase("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isEdit, id, user.token, user.userId, navigate]);

  const totalImageCount = images.length + existingImages.length;

  function handleFilesSelected(e) {
    const files = Array.from(e.target.files);
    e.target.value = "";
    if (!files.length) return;
    if (totalImageCount + files.length > MAX_IMAGES) {
      setBanner({ type: "error", message: `You can add up to ${MAX_IMAGES} photos.` });
      return;
    }
    setImages((prev) => [...prev, ...files]);
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeExistingImage(index) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(status) {
    setBanner(null);
    if (!formData.title.trim() || !formData.price || !formData.category || !formData.condition || !formData.region) {
      setBanner({ type: "error", message: "Please fill in all required fields." });
      return;
    }

    setLoading(status);
    try {
      const uploadedUrls = await uploadImages(images);
      const allImages = [...existingImages, ...uploadedUrls];

      if (isEdit) {
        await updateListing(user.token, id, {
          ...formData,
          price: parseFloat(formData.price),
          images: allImages,
        });

        navigate("/my-listings", {
          state: { flash: { type: "success", message: "Listing updated." } },
        });
        return;
      }

      const listing = {
        ...formData,
        price: parseFloat(formData.price),
        images: allImages,
        status,
        sellerId: user.userId,
        sellerName: user.name,
        sellerBannerId: user.bannerId,
        createdAt: new Date().toISOString(),
      };

      await createListing(user.token, listing);

      navigate("/my-listings", {
        state: {
          flash: {
            type: "success",
            message: status === "draft" ? "Draft saved." : "Listing published — buyers can see it now.",
          },
        },
      });
    } catch (err) {
      setBanner({ type: "error", message: err.message || "Something went wrong, please try again." });
    } finally {
      setLoading(null);
    }
  }

  const titleHint = formData.title.trim() ? { state: "good", text: "Clear, searchable title" } : null;

  const priceNum = Number(formData.price);
  const priceHint =
    formData.price === ""
      ? null
      : priceNum >= 0 && !Number.isNaN(priceNum)
        ? { state: "good", text: "Valid amount" }
        : { state: "bad", text: "Enter a valid price" };

  const descLen = formData.description.trim().length;
  const descHint =
    descLen === 0
      ? null
      : descLen < DESCRIPTION_MIN_LENGTH
        ? { state: "bad", text: `Add at least ${DESCRIPTION_MIN_LENGTH} characters so the AI summary has enough detail` }
        : { state: "good", text: "Nice — that's enough detail for a good AI summary" };

  const busy = loading !== null;

  if (isEdit && loadPhase !== "ready") {
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
          {loadPhase === "loading" && <CircularProgress />}
          {loadPhase === "error" && (
            <Stack alignItems="center" spacing={2}>
              <Typography color="text.secondary">Couldn&rsquo;t load this listing.</Typography>
              <Button variant="contained" onClick={() => navigate("/my-listings")}>
                Back to my listings
              </Button>
            </Stack>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f2f2f2" }}>
      <AppNav />
      <Banner type={banner?.type} message={banner?.message} onClose={() => setBanner(null)} />

      <Container maxWidth={false} sx={{ maxWidth: 760, py: 4 }}>
        <Typography component="h1" sx={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.4px", mb: 0.5 }}>
          {isEdit ? "Edit listing" : "Post an item"}
        </Typography>
        <Typography sx={{ fontSize: 15, color: "text.secondary", mb: 3.25 }}>
          {isEdit
            ? "Update the details below."
            : "Fill in the details — we’ll auto-generate an AI summary buyers can skim."}
        </Typography>

        <Paper variant="outlined" sx={{ p: 2.75, borderRadius: 2.5 }}>
          {/* Photos */}
          <Box sx={{ mb: 2.25 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4d4d4d", mb: 0.9 }}>
              Photos <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>(up to {MAX_IMAGES})</Box>
            </Typography>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFilesSelected}
            />

            <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${MAX_IMAGES}, 1fr)`, gap: 1.25 }}>
              {existingImages.map((url, i) => (
                <Box
                  key={`existing-${url}`}
                  sx={{
                    position: "relative",
                    height: 110,
                    borderRadius: 2,
                    overflow: "hidden",
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <Box
                    component="img"
                    src={url}
                    alt=""
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <IconButton
                    aria-label={`Remove photo ${i + 1}`}
                    onClick={() => removeExistingImage(i)}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      bgcolor: "rgba(26,26,26,0.65)",
                      color: "#fff",
                      "&:hover": { bgcolor: "rgba(26,26,26,0.85)" },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                  {i === 0 && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        bgcolor: "rgba(26,26,26,0.65)",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 600,
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 999,
                      }}
                    >
                      Cover
                    </Box>
                  )}
                </Box>
              ))}

              {images.map((file, i) => (
                <Box
                  key={file.name + i}
                  sx={{
                    position: "relative",
                    height: 110,
                    borderRadius: 2,
                    overflow: "hidden",
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <Box
                    component="img"
                    src={previews[i]}
                    alt=""
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <IconButton
                    aria-label={`Remove photo ${existingImages.length + i + 1}`}
                    onClick={() => removeImage(i)}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      bgcolor: "rgba(26,26,26,0.65)",
                      color: "#fff",
                      "&:hover": { bgcolor: "rgba(26,26,26,0.85)" },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                  {existingImages.length === 0 && i === 0 && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        bgcolor: "rgba(26,26,26,0.65)",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 600,
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 999,
                      }}
                    >
                      Cover
                    </Box>
                  )}
                </Box>
              ))}

              {totalImageCount < MAX_IMAGES &&
                Array.from({ length: MAX_IMAGES - totalImageCount }).map((_, i) => (
                  <Box
                    key={`add-${i}`}
                    component="button"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Add photo"
                    sx={{
                      height: 110,
                      borderRadius: 2,
                      bgcolor: "#f2f2f2",
                      border: "1px dashed #cfcfcf",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#a6a6a6",
                      "&:focus-visible": { outline: "2px solid #1a1a1a", outlineOffset: 2 },
                    }}
                  >
                    {totalImageCount === 0 && i === 0 ? (
                      <ImageOutlinedIcon sx={{ fontSize: 26 }} />
                    ) : (
                      <AddIcon sx={{ fontSize: 22 }} />
                    )}
                  </Box>
                ))}
            </Box>

            <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.9 }}>
              First photo becomes the cover. Stored securely via Cloudinary.
            </Typography>
          </Box>

          {/* Title */}
          <Box sx={{ mb: 2.25 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4d4d4d", mb: 0.9 }}>Title</Typography>
            <TextField
              fullWidth
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. IKEA Micke study desk — white"
              inputProps={{ "aria-label": "Title" }}
            />
            <FieldHint state={titleHint?.state} text={titleHint?.text} />
          </Box>

          {/* Price + Category */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.25, mb: 2.25 }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4d4d4d", mb: 0.9 }}>Price (CAD)</Typography>
              <TextField
                fullWidth
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                inputProps={{ min: 0, "aria-label": "Price in CAD" }}
              />
              <FieldHint state={priceHint?.state} text={priceHint?.text} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4d4d4d", mb: 0.9 }}>Category</Typography>
              <Select
                fullWidth
                displayEmpty
                name="category"
                value={formData.category}
                onChange={handleChange}
                aria-label="Category"
              >
                <MenuItem value="" disabled>
                  Select
                </MenuItem>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Box>

          {/* Condition + Region */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.25, mb: 2.25 }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4d4d4d", mb: 0.9 }}>Condition</Typography>
              <Select
                fullWidth
                displayEmpty
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                aria-label="Condition"
              >
                <MenuItem value="" disabled>
                  Select
                </MenuItem>
                {CONDITIONS.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4d4d4d", mb: 0.9 }}>Region</Typography>
              <Select
                fullWidth
                displayEmpty
                name="region"
                value={formData.region}
                onChange={handleChange}
                aria-label="Region"
              >
                <MenuItem value="" disabled>
                  Select
                </MenuItem>
                {REGIONS.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Box>

          {/* Description */}
          <Box sx={{ mb: 0.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4d4d4d", mb: 0.9 }}>Description</Typography>
            <TextField
              fullWidth
              multiline
              minRows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="A few sentences about condition, use, and pickup details."
              inputProps={{ "aria-label": "Description" }}
              sx={
                descHint?.state === "bad"
                  ? {
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#fdf6f5",
                        "& fieldset": { borderColor: "#b3322b" },
                        "&:hover fieldset": { borderColor: "#b3322b" },
                        "&.Mui-focused fieldset": { borderColor: "#b3322b" },
                      },
                    }
                  : undefined
              }
            />
            <FieldHint state={descHint?.state} text={descHint?.text} />
          </Box>

          <Divider sx={{ my: 2.25 }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            {!isEdit && (
              <Button
                variant="outlined"
                disabled={busy}
                onClick={() => handleSubmit("draft")}
                sx={{ height: 42, color: "#1a1a1a", borderColor: "#cfcfcf" }}
              >
                {loading === "draft" ? "Saving…" : "Save draft"}
              </Button>
            )}
            <Button
              variant="outlined"
              disabled={busy}
              onClick={() => navigate(-1)}
              sx={{ height: 42, color: "#1a1a1a", borderColor: "#cfcfcf" }}
            >
              Cancel
            </Button>

            <Box sx={{ flexGrow: 1 }} />

            <Button
              variant="contained"
              disabled={busy}
              onClick={() => handleSubmit(isEdit ? "saving" : "published")}
              sx={{ height: 42, bgcolor: "#1a1a1a", "&:hover": { bgcolor: "#333" } }}
            >
              {isEdit
                ? loading === "saving"
                  ? "Saving…"
                  : "Save changes"
                : loading === "published"
                  ? "Publishing…"
                  : "Publish & generate summary"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
