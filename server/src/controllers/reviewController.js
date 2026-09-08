const { db } = require('../config/firebase');
const { reviewModel, listingModel, userModel } = require('../models');
const ApiError = require('../utils/ApiError');
const cache = require('../utils/cache');

const CACHE_TTL_MS = 15_000;

async function createReview(req, res, next) {
  try {
    const errors = reviewModel.validateReview(req.body);
    if (errors.length) {
      throw ApiError.badRequest('Invalid review', errors);
    }

    const { sellerId, listingId } = req.body;

    if (sellerId === req.user.userId) {
      throw ApiError.badRequest('Invalid review', ['you cannot review yourself']);
    }

    const listingSnap = await db.collection(listingModel.COLLECTION).doc(listingId).get();
    if (!listingSnap.exists || listingSnap.data().isDeleted) {
      throw ApiError.notFound('Listing not found');
    }
    const listing = listingSnap.data();
    if (listing.sellerId !== sellerId) {
      throw ApiError.badRequest('Invalid review', ['listing does not belong to that seller']);
    }
    if (listing.status !== 'sold') {
      throw ApiError.forbidden('You can only review a sold listing');
    }
    if (listing.buyerId !== req.user.userId) {
      throw ApiError.forbidden('You can only review sellers you have purchased from');
    }

    const review = reviewModel.buildReview(req.body, req.user);
    const reviewRef = db
      .collection(reviewModel.COLLECTION)
      .doc(`${req.user.userId}_${listingId}`);
    const sellerRef = db.collection(userModel.COLLECTION).doc(sellerId);

    await db.runTransaction(async (tx) => {
      const [existing, sellerDoc] = await Promise.all([tx.get(reviewRef), tx.get(sellerRef)]);
      if (existing.exists) {
        throw new ApiError(409, 'You have already reviewed this listing');
      }
      if (!sellerDoc.exists) {
        throw ApiError.notFound('Seller not found');
      }
      const { ratingAvg = 0, ratingCount = 0 } = sellerDoc.data();
      const newCount = ratingCount + 1;
      const newAvg = (ratingAvg * ratingCount + review.rating) / newCount;
      tx.set(reviewRef, review);
      tx.update(sellerRef, {
        ratingAvg: Math.round(newAvg * 100) / 100,
        ratingCount: newCount,
      });
    });
    cache.clear();

    res.status(201).json({ id: reviewRef.id, ...review });
  } catch (err) {
    next(err);
  }
}

async function getSellerReviews(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const cursor = req.query.cursor || '';

    const cacheKey = `seller-reviews:${req.params.id}:${limit}:${cursor}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let query = db
      .collection(reviewModel.COLLECTION)
      .where('sellerId', '==', req.params.id)
      .where('flagged', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (cursor) {
      query = query.startAfter(cursor);
    }

    const snap = await query.get();
    const reviews = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const nextCursor =
      reviews.length === limit ? reviews[reviews.length - 1].createdAt : null;

    const body = { reviews, nextCursor };
    cache.set(cacheKey, body, CACHE_TTL_MS);
    res.json(body);
  } catch (err) {
    next(err);
  }
}

async function flagReview(req, res, next) {
  try {
    const ref = db.collection(reviewModel.COLLECTION).doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw ApiError.notFound('Review not found');
    }

    await ref.update({ flagged: true });
    cache.clear();
    res.json({ id: req.params.id, flagged: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReview, getSellerReviews, flagReview };
