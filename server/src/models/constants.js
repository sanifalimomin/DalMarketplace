const COLLECTIONS = {
  USERS: 'users',
  LISTINGS: 'listings',
  REVIEWS: 'reviews',
};

const CATEGORIES = ['Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
const REGIONS = ['Halifax', 'Dartmouth', 'Bedford', 'Sackville', 'Other'];

const LISTING_STATUS = ['draft', 'available', 'reserved', 'sold'];

const MAX_IMAGES = 5;
const RATING_MIN = 1;
const RATING_MAX = 5;

module.exports = {
  COLLECTIONS,
  CATEGORIES,
  CONDITIONS,
  REGIONS,
  LISTING_STATUS,
  MAX_IMAGES,
  RATING_MIN,
  RATING_MAX,
};
