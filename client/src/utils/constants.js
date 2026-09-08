export const CATEGORIES = ["Electronics", "Furniture", "Clothing", "Books", "Sports", "Other"];
export const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];
export const REGIONS = ["Halifax", "Dartmouth", "Bedford", "Sackville", "Other"];
export const MAX_IMAGES = 5;
export const DESCRIPTION_MIN_LENGTH = 20;

export const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

// Statuses a seller can set via PATCH /api/listings/:id/status.
export const SETTABLE_STATUSES = ["available", "reserved", "sold"];

export const STATUS_META = {
  available: { label: "Available", dot: "#2b2b2b" },
  reserved: { label: "Reserved", dot: "#8a8a8a" },
  sold: { label: "Sold", dot: "#ffffff", solid: true },
  draft: { label: "Draft", dot: "#8a8a8a" },
};
