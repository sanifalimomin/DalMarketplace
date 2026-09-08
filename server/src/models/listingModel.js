const {
  COLLECTIONS,
  CATEGORIES,
  CONDITIONS,
  REGIONS,
  LISTING_STATUS,
  MAX_IMAGES,
} = require('./constants');

// Document shape for the `listings` collection:
//   title           string
//   title_lower     string   (lowercased title — powers prefix search)
//   description     string
//   price           number   (>= 0)
//   category        string   (one of CATEGORIES)
//   condition       string   (one of CONDITIONS)
//   region          string   (one of REGIONS)
//   images          string[] (Cloudinary URLs, max MAX_IMAGES)
//   status          string   (one of LISTING_STATUS)
//   aiSummary       string | null  (Gemini-generated listing summary)
//   sellerId        string   (users doc id)
//   sellerName      string
//   sellerBannerId  string
//   isDeleted       boolean  (soft-delete flag — excluded from browse/detail when true)
//   deletedAt       string | null  (ISO timestamp when soft-deleted)
//   createdAt       string   (ISO timestamp)
//   updatedAt       string   (ISO timestamp)


function buildListing(data, seller) {
  const now = new Date().toISOString();
  const title = (data.title || '').trim();
  const rawStatus = data.status === 'published' ? 'available' : data.status;
  return {
    title,
    title_lower: title.toLowerCase(),
    description: (data.description || '').trim(),
    price: Number(data.price),
    category: data.category,
    condition: data.condition,
    region: data.region,
    images: Array.isArray(data.images) ? data.images.slice(0, MAX_IMAGES) : [],
    status: LISTING_STATUS.includes(rawStatus) ? rawStatus : 'draft',
    aiSummary: data.aiSummary || null,
    sellerId: seller.userId,
    sellerName: seller.name,
    sellerBannerId: seller.bannerId,
    isDeleted: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    buyerId: data.buyerId,
  };
}

function buildListingUpdate(data) {
  const update = { updatedAt: new Date().toISOString() };
  if (data.title !== undefined) {
    update.title = data.title.trim();
    update.title_lower = update.title.toLowerCase();
  }
  if (data.description !== undefined) update.description = data.description.trim();
  if (data.price !== undefined) update.price = Number(data.price);
  if (data.category !== undefined) update.category = data.category;
  if (data.condition !== undefined) update.condition = data.condition;
  if (data.region !== undefined) update.region = data.region;
  if (data.images !== undefined) {
    update.images = Array.isArray(data.images) ? data.images.slice(0, MAX_IMAGES) : [];
  }
  if (data.status !== undefined) update.status = data.status;
  if (data.aiSummary !== undefined) update.aiSummary = data.aiSummary;
  if (data.buyerId !== undefined) update.buyerId = data.buyerId;
  return update;
}

function validateListing(data = {}, { partial = false } = {}) {
  const errors = [];

  const has = (k) => data[k] !== undefined;
  const checks = (k) => !partial || has(k);

  if (checks('title') && (!data.title || !data.title.trim())) {
    errors.push('title is required');
  }
  if (checks('price')) {
    const price = Number(data.price);
    if (data.price === undefined || data.price === null || Number.isNaN(price) || price < 0) {
      errors.push('price must be a number >= 0');
    }
  }
  if (checks('category') && !CATEGORIES.includes(data.category)) {
    errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  }
  if (checks('condition') && !CONDITIONS.includes(data.condition)) {
    errors.push(`condition must be one of: ${CONDITIONS.join(', ')}`);
  }
  if (checks('region') && !REGIONS.includes(data.region)) {
    errors.push(`region must be one of: ${REGIONS.join(', ')}`);
  }
  if (has('images') && (!Array.isArray(data.images) || data.images.length > MAX_IMAGES)) {
    errors.push(`images must be an array of at most ${MAX_IMAGES} URLs`);
  }
  if (has('status') && data.status !== 'published' && !LISTING_STATUS.includes(data.status)) {
    errors.push(`status must be one of: ${LISTING_STATUS.join(', ')}`);
  }

  return errors;
}

module.exports = {
  COLLECTION: COLLECTIONS.LISTINGS,
  buildListing,
  buildListingUpdate,
  validateListing,
};
