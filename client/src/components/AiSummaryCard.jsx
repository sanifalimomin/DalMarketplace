import { Paper, Stack, Chip, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

export default function AiSummaryCard({ summary }) {
  if (!summary) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2.25, mt: 2.5, bgcolor: "#fafafa", borderRadius: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ mb: 1.25 }}>
        <Chip
          icon={<AutoAwesomeIcon />}
          label="AI summary"
          size="small"
          sx={{ bgcolor: "#e6e6e6", fontWeight: 700, textTransform: "uppercase", fontSize: 11 }}
        />
        <Typography variant="caption" color="text.secondary">
          Generated from the seller&rsquo;s description
        </Typography>
      </Stack>
      <Typography sx={{ color: "#4d4d4d", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
        {summary}
      </Typography>
    </Paper>
  );
}
