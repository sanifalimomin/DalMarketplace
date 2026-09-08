const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase.js');
const { userModel } = require('../models');
const ApiError = require('../utils/ApiError.js');
const { sendEmail } = require('../utils/emailService.js');
const { verificationEmailTemplate } = require('../utils/emailTemplates.js');

async function findUserByBannerId(bannerId) {
  const query = await db.collection(userModel.COLLECTION).where('bannerId', '==', bannerId).get();
  if (query.empty) {
    throw ApiError.badRequest('User not found');
  }
  return query.docs[0];
}

// POST /api/verify/send — (re)sends the verification email. Verification status lives
// directly on the user's own doc (emailVerified), keyed by userId in the token — this
// used to be tracked in a separate `verification` collection matched by bannerId/email,
// which could return the wrong doc when more than one existed for the same bannerId.
async function sendVerificationEmail(req, res, next) {
  const { bannerId } = req.body;
  try {
    const userDoc = await findUserByBannerId(bannerId);

    const token = jwt.sign({ userId: userDoc.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const { html, text } = verificationEmailTemplate(link);

    await sendEmail(userDoc.data().email, 'Verify your DalMarketplace email', text, html);

    res.json({ message: 'Verification email sent' });
  } catch (err) {
    next(err);
  }
}

// POST /api/verify/verify?token=... — called from the emailed link.
async function verifyEmail(req, res, next) {
  const { token } = req.query;
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);

    const ref = db.collection(userModel.COLLECTION).doc(userId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw ApiError.badRequest('User not found');
    }

    await ref.update({ emailVerified: true });

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
}

// POST /api/verify/check-status — polled by the client while waiting for the link to be clicked.
async function checkVerificationStatus(req, res, next) {
  const { bannerId } = req.body;
  try {
    const userDoc = await findUserByBannerId(bannerId);

    res.json({ verified: userDoc.data().emailVerified === true });
  } catch (err) {
    next(err);
  }
}

// POST /api/verify/getEmail — resolves the email address for a bannerId (the
// emailVerification page only always has bannerId, not necessarily the email itself).
async function getEmail(req, res, next) {
  const { bannerId } = req.body;
  try {
    const userDoc = await findUserByBannerId(bannerId);

    res.json({ email: userDoc.data().email });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendVerificationEmail, verifyEmail, checkVerificationStatus, getEmail };
