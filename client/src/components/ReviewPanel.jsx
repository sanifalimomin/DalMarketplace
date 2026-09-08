import { Typography, Button, TextField, Rating, CircularProgress, Box } from "@mui/material";

export default function ReviewPanel({
  eligibilityChecked,
  hasPurchased,
  listingId,
  listingTitle,
  myReview,
  rating,
  setRating,
  reviewText,
  setReviewText,
  reviewSubmitted,
  postingReview,
  onSubmit,
}) {
  if (!eligibilityChecked) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={22} />
      </Box>
    );
  }

  if (!hasPurchased) {
    return (
      <>
        <Typography sx={{ fontSize: 19, fontWeight: 600, mb: 0.5 }}>Leave a review</Typography>
        <Typography sx={{ fontSize: 13, color: "#808080" }}>
          {listingId
            ? "You can only review a seller after a completed (sold) purchase from them."
            : "To leave a review, open one of this seller's listings you bought and message them from there — reviews are tied to a completed (sold) purchase."}
        </Typography>
      </>
    );
  }

  return (
    <Box component="form" onSubmit={onSubmit}>
      <Typography sx={{ fontSize: 19, fontWeight: 600, mb: 0.5 }}>Leave a review</Typography>
      <Typography sx={{ fontSize: 13, color: "#808080", mb: 2 }}>
        You bought{" "}
        <Box component="span" sx={{ color: "#4d4d4d", fontWeight: 600 }}>
          {listingTitle || "this item"}
        </Box>{" "}
        from this seller.
      </Typography>

      <Box sx={{ mb: 2.25, opacity: myReview ? 0.6 : 1 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4d4d4d", mb: 0.9 }}>
          Your rating
        </Typography>
        <Rating
          value={myReview ? myReview.rating : rating}
          onChange={myReview ? undefined : (_, value) => setRating(value || 0)}
          readOnly={Boolean(myReview)}
          size="large"
          sx={{ color: "#1a1a1a", fontSize: 30 }}
        />
        {reviewSubmitted && !rating && !myReview && (
          <Typography sx={{ fontSize: 12, color: "#b3322b", mt: 0.5 }}>
            Please select a rating.
          </Typography>
        )}
      </Box>

      <Box sx={{ mb: 2.25 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#4d4d4d", mb: 0.9 }}>
          Your review
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={4}
          value={myReview ? myReview.comment || "" : reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          disabled={Boolean(myReview)}
          placeholder="Quick, friendly, item as described."
          inputProps={{ "aria-label": "Your review" }}
        />
      </Box>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={postingReview || Boolean(myReview)}
        sx={{ height: 44, bgcolor: "#1a1a1a", "&:hover": { bgcolor: "#333" }, textTransform: "none" }}
      >
        {postingReview && <CircularProgress size={16} sx={{ color: "#fff", mr: 1.25 }} />}
        {myReview ? "Already reviewed" : postingReview ? "Posting…" : "Post review"}
      </Button>
      <Typography sx={{ fontSize: 12, color: "#808080", textAlign: "center", mt: 0.9 }}>
        {myReview
          ? "You've already reviewed this purchase — only one review per item."
          : "Only buyers with a completed (sold) transaction can review — keeping ratings trustworthy."}
      </Typography>
    </Box>
  );
}
