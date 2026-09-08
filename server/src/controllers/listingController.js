const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../config/firebase");
const { listingModel } = require("../models");
const ApiError = require("../utils/ApiError");
const { userModel } = require("../models");
const cache = require("../utils/cache");

// POST /api/listings — create a listing (draft or published)
const { generateListingSummary } = require("../services/aiSummaryService");

const CACHE_TTL_MS = 15_000;

async function createListing(req, res, next) {
  try {
    const errors = listingModel.validateListing(req.body);
    if (errors.length) {
      throw ApiError.badRequest("Invalid listing", errors);
    }

    let aiSummary = null;

    try {
      aiSummary = await generateListingSummary(req.body);
    } catch (aiErr) {
      console.error("AI summary generation failed:", aiErr.message);
    }

    const listing = listingModel.buildListing(
      { ...req.body, aiSummary },
      req.user,
    );

    const ref = await db.collection(listingModel.COLLECTION).add(listing);
    cache.clear();
    res.status(201).json({ id: ref.id, aiSummary: listing.aiSummary });
  } catch (err) {
    next(err);
  }
}

async function loadOwnedListing(id, user) {
  const ref = db.collection(listingModel.COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists || doc.data().isDeleted) {
    throw ApiError.notFound("Listing not found");
  }
  if (doc.data().sellerId !== user.userId) {
    throw ApiError.forbidden("You do not own this listing");
  }
  return { ref, data: doc.data() };
}

// GET /api/listings — paginated browse of published (available) listings.
async function listListings(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const cursor = req.query.cursor || "";

    const cacheKey = `list:${limit}:${cursor}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let query = db
      .collection(listingModel.COLLECTION)
      .where("status", "==", "available")
      .where("isDeleted", "==", false)
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (cursor) {
      query = query.startAfter(cursor);
    }

    const snap = await query.get();
    const listings = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const nextCursor =
      listings.length === limit
        ? listings[listings.length - 1].createdAt
        : null;

    const body = { listings, nextCursor };
    cache.set(cacheKey, body, CACHE_TTL_MS);
    res.json(body);
  } catch (err) {
    next(err);
  }
}

const CANDIDATE_CAP = 500;
const SEARCH_FIELDS = [
  "title", "title_lower", "price", "category", "condition", "region", "images",
  "status", "sellerId", "sellerName", "createdAt",
];
const SORTS = {
  recent: (a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
};

async function getCandidateListings(category, region, condition) {
  const cacheKey = `search-candidates:${category}:${region}:${condition}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let query = db
    .collection(listingModel.COLLECTION)
    .where("isDeleted", "==", false)
    .where("status", "==", "available");

  if (category) query = query.where("category", "==", category);
  if (region) query = query.where("region", "==", region);
  if (condition) query = query.where("condition", "==", condition);

  query = query.orderBy("createdAt", "desc");

  const snap = await query.select(...SEARCH_FIELDS).limit(CANDIDATE_CAP).get();
  const listings = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  cache.set(cacheKey, listings, CACHE_TTL_MS);
  return listings;
}

async function searchListings(req, res, next) {
  try {
    const q = (req.query.q || "").trim().toLowerCase();
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const sort = SORTS[req.query.sort] ? req.query.sort : "recent";
    const category = req.query.category || "";
    const region = req.query.region || "";
    const condition = req.query.condition || "";

    let listings = await getCandidateListings(category, region, condition);

    // Firestore only supports prefix range queries (title_lower >= q <= q+""), which
    // missed "monitor" matching "LED Monitor" since the term isn't a title prefix. Filtering
    // the candidate page in memory instead matches the term anywhere in the title.
    if (q) {
      listings = listings.filter((l) =>
        (l.title_lower || l.title || "").toLowerCase().includes(q),
      );
    }

    const minPrice =
      req.query.minPrice !== undefined ? Number(req.query.minPrice) : null;
    const maxPrice =
      req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : null;
    if (minPrice !== null && !Number.isNaN(minPrice)) {
      listings = listings.filter((l) => l.price >= minPrice);
    }
    if (maxPrice !== null && !Number.isNaN(maxPrice)) {
      listings = listings.filter((l) => l.price <= maxPrice);
    }

    listings.sort(SORTS[sort]);

    const total = listings.length;
    const page = listings.slice(offset, offset + limit);
    const nextOffset = offset + limit < total ? offset + limit : null;

    await attachSellerRatings(page);

    res.json({ listings: page, total, nextOffset });
  } catch (err) {
    next(err);
  }
}

// Batch-fetch seller ratings for a page of listings so cards can show star ratings.
async function attachSellerRatings(listings) {
  const sellerIds = [...new Set(listings.map((l) => l.sellerId).filter(Boolean))];
  if (!sellerIds.length) return;

  const refs = sellerIds.map((id) => db.collection(userModel.COLLECTION).doc(id));
  const snaps = await db.getAll(...refs);

  const ratingById = {};
  snaps.forEach((s) => {
    if (s.exists) {
      ratingById[s.id] = { avg: s.data().ratingAvg || 0, count: s.data().ratingCount || 0 };
    }
  });

  listings.forEach((l) => {
    const r = ratingById[l.sellerId] || { avg: 0, count: 0 };
    l.sellerRatingAvg = r.avg;
    l.sellerRatingCount = r.count;
  });
}

// GET /api/listings/mine — the authed user's own listings across every status
async function myListings(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

    let query = db
      .collection(listingModel.COLLECTION)
      .where("sellerId", "==", req.user.userId)
      .where("isDeleted", "==", false)
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (req.query.cursor) {
      query = query.startAfter(req.query.cursor);
    }

    const snap = await query.get();
    const listings = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const nextCursor =
      listings.length === limit
        ? listings[listings.length - 1].createdAt
        : null;

    res.json({ listings, nextCursor });
  } catch (err) {
    next(err);
  }
}

// GET /api/listings/:id — single listing detail. Joins the seller's denormalized
// rating (ratingAvg/ratingCount) so the detail page can show their star rating.
async function getListing(req, res, next) {
  try {
    const ref = db.collection(listingModel.COLLECTION).doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.data().isDeleted) {
      throw ApiError.notFound("Listing not found");
    }
    const data = doc.data();

    if (!data.aiSummary) {
      try {
        console.log("Generating AI Summary");
        const aiSummary = await generateListingSummary(data);
        if (aiSummary) {
          await ref.update({ aiSummary, updatedAt: new Date().toISOString() });
          data.aiSummary = aiSummary;
        }
      } catch (aiErr) {
        console.error("AI summary generation failed:", aiErr.message);
      }
    }

    let sellerRatingAvg = 0;
    let sellerRatingCount = 0;
    if (data.sellerId) {
      const seller = await db.collection(userModel.COLLECTION).doc(data.sellerId).get();
      if (seller.exists) {
        sellerRatingAvg = seller.data().ratingAvg || 0;
        sellerRatingCount = seller.data().ratingCount || 0;
      }
    }

    res.json({ id: doc.id, ...data, sellerRatingAvg, sellerRatingCount });
  } catch (err) {
    next(err);
  }
}

// PUT /api/listings/:id — edit a listing (owner only). Partial body allowed.
async function updateListing(req, res, next) {
  try {
    const errors = listingModel.validateListing(req.body, { partial: true });
    if (errors.length) {
      throw ApiError.badRequest("Invalid listing", errors);
    }

    const { ref } = await loadOwnedListing(req.params.id, req.user);
    const update = listingModel.buildListingUpdate(req.body);
    await ref.update(update);
    cache.clear();

    res.json({ id: req.params.id, ...update });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/listings/:id — soft delete (owner only). Flags the doc rather than removing it,
async function deleteListing(req, res, next) {
  try {
    const { ref } = await loadOwnedListing(req.params.id, req.user);
    const now = new Date().toISOString();
    await ref.update({ isDeleted: true, deletedAt: now, updatedAt: now });
    cache.clear();

    res.json({ id: req.params.id, isDeleted: true });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id/status — set sale status (owner only).
const SETTABLE_STATUS = ["available", "reserved", "sold"];
async function updateListingStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!SETTABLE_STATUS.includes(status)) {
      throw ApiError.badRequest("Invalid status", [
        `status must be one of: ${SETTABLE_STATUS.join(", ")}`,
      ]);
    }

    const { ref } = await loadOwnedListing(req.params.id, req.user);
    await ref.update({ status, updatedAt: new Date().toISOString() });
    cache.clear();

    res.json({ id: req.params.id, status });
  } catch (err) {
    next(err);
  }
}

async function getListings(req, res, next) {
  try {
    const { sellerId, status, buyerId } = req.query;

    // You can only ever list your own purchases — otherwise this would let any
    // logged-in user enumerate who bought what from whom.
    if (buyerId && buyerId !== req.user.userId) {
      throw ApiError.forbidden("You can only view your own purchases");
    }

    let query = db
      .collection(listingModel.COLLECTION)
      .where("isDeleted", "==", false);

    if (sellerId) {
      query = query.where("sellerId", "==", sellerId);
    }

    if (status) {
      query = query.where("status", "==", status);
    }

    if (buyerId) {
      query = query.where("buyerId", "==", buyerId);
    }

    const snap = await query.get();
    let listings = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Drafts are private to their owner — never leak them to other users,
    // even if no status filter was requested.
    const isOwnListings = sellerId && sellerId === req.user.userId;
    if (!isOwnListings) {
      listings = listings.filter((l) => l.status !== "draft");
    }

    res.json({ listings });
  } catch (err) {
    next(err);
  }
}

// POST /api/listings/:id/save — add a listing to the caller's saved/favorites list.
async function saveListing(req, res, next) {
  try {
    const doc = await db.collection(listingModel.COLLECTION).doc(req.params.id).get();
    if (!doc.exists || doc.data().isDeleted) {
      throw ApiError.notFound("Listing not found");
    }

    await db
      .collection(userModel.COLLECTION)
      .doc(req.user.userId)
      .update({ savedListingIds: FieldValue.arrayUnion(req.params.id) });

    res.json({ id: req.params.id, saved: true });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/listings/:id/save — remove a listing from the caller's saved/favorites list.
async function unsaveListing(req, res, next) {
  try {
    await db
      .collection(userModel.COLLECTION)
      .doc(req.user.userId)
      .update({ savedListingIds: FieldValue.arrayRemove(req.params.id) });

    res.json({ id: req.params.id, saved: false });
  } catch (err) {
    next(err);
  }
}

// GET /api/listings/saved — the authed user's saved/favorited listings.
async function listSavedListings(req, res, next) {
  try {
    const userDoc = await db.collection(userModel.COLLECTION).doc(req.user.userId).get();
    const ids = (userDoc.exists && userDoc.data().savedListingIds) || [];
    if (!ids.length) return res.json({ listings: [] });

    const refs = ids.map((id) => db.collection(listingModel.COLLECTION).doc(id));
    const snaps = await db.getAll(...refs);
    const listings = snaps
      .filter((s) => s.exists && !s.data().isDeleted)
      .map((s) => ({ id: s.id, ...s.data() }));

    await attachSellerRatings(listings);

    res.json({ listings });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createListing,
  listListings,
  searchListings,
  myListings,
  getListing,
  updateListing,
  deleteListing,
  updateListingStatus,
  getListings,
  saveListing,
  unsaveListing,
  listSavedListings,
};
