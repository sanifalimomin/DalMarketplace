const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createListing,
  listListings,
  searchListings,
  myListings,
  getListing,
  updateListing,
  deleteListing,
  updateListingStatus,
  saveListing,
  unsaveListing,
  listSavedListings,
} = require('../controllers/listingController');

router.get('/', authMiddleware, (req, res, next) => {
  // If filters exist → use getListings
  if (req.query.sellerId || req.query.status || req.query.buyerId) {
    return require('../controllers/listingController').getListings(req, res, next);
  }

  // Otherwise → use the original listListings
  return listListings(req, res, next);
});

// Static paths must precede the '/:id' param route, or Express captures them as an id.
router.get('/search', authMiddleware, searchListings);
router.get('/mine', authMiddleware, myListings);
router.get('/saved', authMiddleware, listSavedListings);
router.get('/:id', authMiddleware, getListing);
router.post('/', authMiddleware, createListing);
router.put('/:id', authMiddleware, updateListing);
router.patch('/:id/status', authMiddleware, updateListingStatus);
router.post('/:id/save', authMiddleware, saveListing);
router.delete('/:id/save', authMiddleware, unsaveListing);
router.delete('/:id', authMiddleware, deleteListing);

module.exports = router;
