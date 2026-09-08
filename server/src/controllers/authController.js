const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');
const ApiError = require('../utils/ApiError');
const { userModel } = require('../models');

async function signup(req, res, next) {
  try {
    const errors = userModel.validateNewUser(req.body);
    if (errors.length) {
      throw ApiError.badRequest('Invalid signup', errors);
    }

    const email = req.body.email.trim().toLowerCase();
    const bannerId = req.body.bannerId.trim();

    const [existingEmail, existingBannerId] = await Promise.all([
      db.collection(userModel.COLLECTION).where('email', '==', email).get(),
      db.collection(userModel.COLLECTION).where('bannerId', '==', bannerId).get(),
    ]);
    if (!existingEmail.empty) {
      throw ApiError.badRequest('Email already registered');
    }
    if (!existingBannerId.empty) {
      throw ApiError.badRequest('Banner ID already registered');
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = userModel.buildUser({ ...req.body, password: hashedPassword });

    const userRef = await db.collection(userModel.COLLECTION).add(user);

    res.status(201).json({ message: 'User registered', userId: userRef.id });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login — authenticates by Banner ID, not email
async function login(req, res, next) {
  const { bannerId, password } = req.body;
  try {
    const userQuery = await db.collection('users').where('bannerId', '==', bannerId).get();
    if (userQuery.empty) {
      throw ApiError.badRequest('Banner ID and Password doesnot Exists in System. You need to Sign Upcre');
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      throw ApiError.badRequest('Banner ID and Password doesnot Match');
    }

    if (!userData.emailVerified) {
      throw new ApiError(403, 'Please verify your email before logging in', {
        code: 'EMAIL_NOT_VERIFIED',
        bannerId: userData.bannerId,
      });
    }

    const token = jwt.sign(
      { userId: userDoc.id, email: userData.email, name: userData.name, bannerId: userData.bannerId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    res.json({
      token,
      userId: userDoc.id,
      bannerId: userData.bannerId,
      name: userData.name,
      avatarUrl: userData.avatarUrl || null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login };
