import { Box } from "@mui/material";
import { STATUS_META } from "../utils/constants";

// Pill badge with a colored dot, shared by cards / detail / my-listings.
export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, dot: "#8a8a8a" };
  const solid = Boolean(meta.solid);

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.25,
        py: 0.4,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        bgcolor: solid ? "#1a1a1a" : "#f0f0f0",
        color: solid ? "#fff" : "#1a1a1a",
        border: 1,
        borderColor: solid ? "#1a1a1a" : "#cfcfcf",
      }}
    >
      <Box component="span" sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: meta.dot }} />
      {meta.label}
    </Box>
  );
}
