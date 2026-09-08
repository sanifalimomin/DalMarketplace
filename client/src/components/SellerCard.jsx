import { Box, Stack, Avatar, Typography, Chip, Rating, Link } from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import { initials } from "../utils/format";

// Seller identity row — avatar, name, Verified-Dal badge, star rating, and a
// "View profile" link. Reused on the listing detail page and seller profile.
export default function SellerCard({ name, ratingAvg = 0, ratingCount = 0, onViewProfile }) {
  return (
    <Box sx={{ borderTop: 1, borderBottom: 1, borderColor: "divider", py: 1.75, my: 2.25 }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Avatar sx={{ width: 44, height: 44, bgcolor: "#f2f2f2", color: "#4d4d4d", fontSize: 14 }}>
          {initials(name)}
        </Avatar>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
            <Typography sx={{ fontWeight: 600 }}>{name}</Typography>
            <Chip
              icon={<VerifiedIcon />}
              label="Verified Dal"
              size="small"
              sx={{ bgcolor: "#ededed" }}
            />
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5 }}>
            <Rating
              value={ratingAvg}
              precision={0.1}
              readOnly
              size="small"
              sx={{ color: "#1a1a1a", "& .MuiRating-iconEmpty": { color: "#cfcfcf" } }}
            />
            <Typography variant="caption" color="text.secondary">
              {ratingCount > 0
                ? `${ratingAvg.toFixed(1)} · ${ratingCount} review${ratingCount === 1 ? "" : "s"}`
                : "No reviews yet"}
            </Typography>
          </Stack>
        </Box>

        {onViewProfile && (
          <Link
            component="button"
            type="button"
            onClick={onViewProfile}
            underline="hover"
            sx={{ fontSize: 13, color: "text.secondary", whiteSpace: "nowrap" }}
          >
            View profile ›
          </Link>
        )}
      </Stack>
    </Box>
  );
}
