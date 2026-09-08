const { COLLECTIONS } = require('./constants');

// Document shape for the `users` collection:
//   email          string  (lowercased, @dal.ca)
//   name           string
//   bannerId       string  (B00xxxxxx)
//   password       string  (bcrypt hash — set by the caller, never the raw password)
//   avatarUrl      string | null
//   ratingAvg      number  (denormalized average of received seller reviews)
//   ratingCount    number  (number of reviews counted into ratingAvg)
//   savedListingIds string[]  (listing doc ids the user has favorited)
//   emailVerified  boolean (must be true before login is allowed)
//   passwordResetToken string | null | undefined (single-use forgot-password token,
//                  cleared once redeemed — set by resetController, not buildUser)
//   createdAt      string  (ISO timestamp)

function buildUser({ email, name, bannerId, password }) {
  return {
    email: email.trim().toLowerCase(),
    name: name.trim(),
    bannerId: bannerId.trim(),
    password,
    avatarUrl: null,
    ratingAvg: 0,
    ratingCount: 0,
    savedListingIds: [],
    emailVerified: false,
    createdAt: new Date().toISOString(),
  };
}

function validateNewUser({ email, name, bannerId, password } = {}) {
  const errors = [];
  if (!email || !email.trim().toLowerCase().endsWith('@dal.ca')) {
    errors.push('email must be a @dal.ca address');
  }
  if (!name || !name.trim()) {
    errors.push('name is required');
  }
  if (!bannerId || !/^B00\d{6}$/i.test(bannerId.trim())) {
    errors.push('bannerId must look like B00xxxxxx');
  }
  if (!password || password.length < 6) {
    errors.push('password must be at least 6 characters');
  }
  return errors;
}

module.exports = { COLLECTION: COLLECTIONS.USERS, buildUser, validateNewUser };
