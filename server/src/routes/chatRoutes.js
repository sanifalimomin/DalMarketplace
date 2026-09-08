const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/token", authMiddleware, chatController.getToken);
router.post("/listing/:listingId/channel",authMiddleware,chatController.createListingChannel);

module.exports = router;