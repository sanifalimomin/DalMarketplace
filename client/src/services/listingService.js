import { api, toQueryString } from "./apiClient";

export function browseListings(token, filters = {}) {
  return api.get(`/api/listings/search${toQueryString(filters)}`, { token });
}

export function fetchMyListings(token, params = {}) {
  return api.get(`/api/listings/mine${toQueryString(params)}`, { token });
}

export function getListing(token, id) {
  return api.get(`/api/listings/${id}`, { token });
}

export function fetchListingsBy(token, filters = {}) {
  return api.get(`/api/listings${toQueryString(filters)}`, { token });
}

export function createListing(token, listing) {
  return api.post("/api/listings", listing, { token });
}

export function updateListing(token, id, listing) {
  return api.put(`/api/listings/${id}`, listing, { token });
}

export function updateListingStatus(token, id, status) {
  return api.patch(`/api/listings/${id}/status`, { status }, { token });
}

export function deleteListing(token, id) {
  return api.del(`/api/listings/${id}`, { token });
}

export function fetchSavedListings(token) {
  return api.get("/api/listings/saved", { token });
}

export function saveListing(token, id) {
  return api.post(`/api/listings/${id}/save`, undefined, { token });
}

export function unsaveListing(token, id) {
  return api.del(`/api/listings/${id}/save`, { token });
}
