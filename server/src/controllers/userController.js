const bcrypt = require('bcryptjs');
const { db } = require('../config/firebase');
const { userModel } = require('../models');
const ApiError = require('../utils/ApiError');

// Fields safe to expose to other users (never the password hash, never
// savedListingIds — that's private favoriting data, not public profile info).
function toPublicUser(id, data) {
  return {
    id,
    name: data.name,
    email: data.email,
    bannerId: data.bannerId,
    avatarUrl: data.avatarUrl || null,
    ratingAvg: data.ratingAvg || 0,
    ratingCount: data.ratingCount || 0,
    emailVerified: data.emailVerified === true,
    createdAt: data.createdAt,
  };
}

// GET /api/users/:id — a seller's public profile (name, rating, etc). Never the
// password hash or savedListingIds.
async function getUser(req, res, next) {
  try {
    const doc = await db
      .collection(userModel.COLLECTION)
      .doc(req.params.id)
      .get();

    if (!doc.exists || doc.data().isDeleted) {
      throw ApiError.notFound("User not found");
    }

    res.json(toPublicUser(doc.id, doc.data()));
  } catch (err) {
    next(err);
  }
}

// GET /api/users — bulk lookup (e.g. the seller "assign a buyer" picker). Same
// public whitelist as getUser — never the password hash.
async function getUsers(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);

    let query = db
      .collection(userModel.COLLECTION)
      .limit(limit);

    const snap = await query.get();

    const users = snap.docs.map((doc) => toPublicUser(doc.id, doc.data()));

    res.json({ users, nextCursor: null });
  } catch (err) {
    console.error("getUsers error:", err);
    next(err);
  }
}

// GET /api/users/me — the authed user's own profile.
async function getMe(req, res, next) {
  try {
    const doc = await db.collection(userModel.COLLECTION).doc(req.user.userId).get();
    if (!doc.exists) {
      throw ApiError.notFound('User not found');
    }

    const { password, ...safe } = doc.data();
    res.json({ id: doc.id, ...safe });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/users/me — edit the authed user's own profile. Only name and avatarUrl
// are editable here; email/bannerId are identity fields tied to login and verification.
async function updateMe(req, res, next) {
  try {
    const update = {};

    if (req.body.name !== undefined) {
      const name = req.body.name.trim();
      if (!name) {
        throw ApiError.badRequest('Invalid profile', ['name is required']);
      }
      update.name = name;
    }

    if (req.body.avatarUrl !== undefined) {
      update.avatarUrl = req.body.avatarUrl || null;
    }

    if (!Object.keys(update).length) {
      throw ApiError.badRequest('Invalid profile', ['no valid fields to update']);
    }

    await db.collection(userModel.COLLECTION).doc(req.user.userId).update(update);

    res.json({ id: req.user.userId, ...update });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/users/me/password — change the authed user's own password.
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest('Invalid request', ['currentPassword and newPassword are required']);
    }
    if (newPassword.length < 6) {
      throw ApiError.badRequest('Invalid request', ['newPassword must be at least 6 characters']);
    }

    const ref = db.collection(userModel.COLLECTION).doc(req.user.userId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw ApiError.notFound('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, doc.data().password);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await ref.update({ password: hashedPassword });

    res.json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUser, getUsers, getMe, updateMe, changePassword };
