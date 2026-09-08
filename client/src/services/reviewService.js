import { api, toQueryString } from "./apiClient";

export function fetchSellerReviews(token, sellerId, params = {}) {
  return api.get(`/api/reviews/seller/${sellerId}${toQueryString(params)}`, { token });
}

export function createReview(token, { sellerId, listingId, rating, comment }) {
  return api.post("/api/reviews", { sellerId, listingId, rating, comment }, { token });
}
