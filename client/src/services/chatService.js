import { api } from "./apiClient";

export function getChatToken(token) {
  return api.post("/api/chat/token", undefined, { token });
}

export function createListingChannel(token, listingId) {
  return api.post(`/api/chat/listing/${listingId}/channel`, undefined, { token });
}
