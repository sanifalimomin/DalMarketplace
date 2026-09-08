import { Box, Card, CardActionArea, Typography, Rating, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import ImageWithFallback from "./ImageWithFallback";

// Grid card for a single listing. Reused by the browse grid.
export default function ListingCard({ listing }) {
  const navigate = useNavigate();
  const img = listing.images?.[0];

  return (
    <Card variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden", height: "100%" }}>
      <CardActionArea onClick={() => navigate(`/listings/${listing.id}`)} sx={{ height: "100%" }}>
        <Box
          sx={{
            height: 170,
            bgcolor: "#f2f2f2",
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <ImageWithFallback
            src={img}
            alt={listing.title}
            width={400}
            height={340}
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <Box sx={{ position: "absolute", top: 10, left: 10 }}>
            <StatusBadge status={listing.status} />
          </Box>
        </Box>

        <Box sx={{ p: "13px 14px 15px" }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, fontVariantNumeric: "tabular-nums" }}>
            ${listing.price}
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
              color: "#4d4d4d",
              mt: 0.25,
              lineHeight: 1.4,
              minHeight: 39,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {listing.title}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1 }}>
            {listing.sellerRatingCount > 0 && (
              <>
                <Rating
                  value={listing.sellerRatingAvg || 0}
                  precision={0.1}
                  readOnly
                  size="small"
                  sx={{ fontSize: 14, color: "#1a1a1a", "& .MuiRating-iconEmpty": { color: "#cfcfcf" } }}
                />
                <Typography sx={{ fontSize: 12, color: "#1a1a1a" }}>
                  {(listing.sellerRatingAvg || 0).toFixed(1)}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>·</Typography>
              </>
            )}
            <Typography sx={{ fontSize: 12, color: "text.secondary" }} noWrap>
              {listing.region}
            </Typography>
          </Stack>
        </Box>
      </CardActionArea>
    </Card>
  );
}
