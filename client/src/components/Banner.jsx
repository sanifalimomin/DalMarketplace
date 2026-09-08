import { Box, Typography, IconButton } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import CloseIcon from "@mui/icons-material/Close";

const VARIANTS = {
  success: { bg: "#eaf6ec", color: "#1e4620", border: "#bfe3c4", Icon: CheckCircleOutlineIcon },
  error: { bg: "#fdf0ef", color: "#7a231d", border: "#f3c6c2", Icon: ErrorOutlineIcon },
};

// Full-width status banner meant to sit directly under AppNav.
export default function Banner({ type = "error", message, onClose }) {
  if (!message) return null;
  const v = VARIANTS[type] || VARIANTS.error;
  const Icon = v.Icon;

  return (
    <Box sx={{ bgcolor: v.bg, borderBottom: 1, borderColor: v.border }}>
      <Box
        sx={{
          maxWidth: 1160,
          mx: "auto",
          px: { xs: 2, sm: 3.5 },
          py: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
        }}
      >
        <Icon sx={{ fontSize: 20, color: v.color, flexShrink: 0 }} />
        <Typography sx={{ fontSize: 14, color: v.color, flex: 1 }}>{message}</Typography>
        {onClose && (
          <IconButton size="small" onClick={onClose} aria-label="Dismiss">
            <CloseIcon sx={{ fontSize: 16, color: v.color }} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}
