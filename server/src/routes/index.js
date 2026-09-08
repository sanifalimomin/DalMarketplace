const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/listings', require('./listingRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use("/chat", require("./chatRoutes"));
router.use('/verify', require('./verifyRoutes'));
router.use('/reset', require('./resetRoutes'));

module.exports = router;
