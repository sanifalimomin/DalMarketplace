const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createReview, getSellerReviews, flagReview } = require('../controllers/reviewController');

router.post('/', authMiddleware, createReview);
router.get('/seller/:id', authMiddleware, getSellerReviews);
router.post('/:id/flag', authMiddleware, flagReview);

module.exports = router;
