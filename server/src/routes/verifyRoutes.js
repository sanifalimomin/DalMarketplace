const express = require('express');
const router = express.Router();
const { sendVerificationEmail, verifyEmail, checkVerificationStatus, getEmail } = require('../controllers/verifyController');

router.post('/send', sendVerificationEmail);
router.post('/verify', verifyEmail);
router.post('/check-status', checkVerificationStatus);
router.post('/getEmail', getEmail)

module.exports = router;
