import { Box, Stack, Typography } from "@mui/material";

// Branded placeholder shown when a listing has no photo — the DM logo mark
// instead of a bare icon. `compact` drops the wordmark for small thumbnails.
export default function NoImage({ compact = false }) {
  const mark = compact ? 34 : 48;
  const markFont = compact ? 14 : 19;

  return (
    <Stack alignItems="center" spacing={0.75} aria-label="No image">
      <Box
        sx={{
          width: mark,
          height: mark,
          borderRadius: 2,
          bgcolor: "#1a1a1a",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: markFont,
        }}
      >
        DM
      </Box>
      {!compact && (
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#a6a6a6", letterSpacing: "0.02em" }}>
          DalMarketplace
        </Typography>
      )}
    </Stack>
  );
}
