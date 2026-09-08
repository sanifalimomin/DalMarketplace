const { COLLECTIONS, RATING_MIN, RATING_MAX } = require('./constants');

// Document shape for the `reviews` collection:
//   sellerId      string  (users doc id being reviewed)
//   reviewerId    string  (users doc id writing the review)
//   reviewerName  string
//   listingId     string  (the sold listing the review is about)
//   rating        number  (integer RATING_MIN..RATING_MAX)
//   comment       string
//   flagged       boolean (reported as abusive)
//   createdAt     string  (ISO timestamp)

function buildReview(data, reviewer) {
  return {
    sellerId: data.sellerId,
    reviewerId: reviewer.userId,
    reviewerName: reviewer.name,
    listingId: data.listingId,
    rating: Number(data.rating),
    comment: (data.comment || '').trim(),
    flagged: false,
    createdAt: new Date().toISOString(),
  };
}

function validateReview(data = {}) {
  const errors = [];
  if (!data.sellerId) errors.push('sellerId is required');
  if (!data.listingId) errors.push('listingId is required');
  const rating = Number(data.rating);
  if (!Number.isInteger(rating) || rating < RATING_MIN || rating > RATING_MAX) {
    errors.push(`rating must be an integer between ${RATING_MIN} and ${RATING_MAX}`);
  }
  return errors;
}

module.exports = { COLLECTION: COLLECTIONS.REVIEWS, buildReview, validateReview };
