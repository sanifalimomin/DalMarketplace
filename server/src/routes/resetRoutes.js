const express = require('express');
const router = express.Router();
const { sendResetEmail, resetPassword } = require('../controllers/resetController');

router.post('/send', sendResetEmail);
router.post('/reset-password', resetPassword);

module.exports = router;
