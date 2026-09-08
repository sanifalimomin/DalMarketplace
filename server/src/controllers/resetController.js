const jwt = require('jsonwebtoken');
const { passwordResetEmailTemplate } = require('../utils/emailTemplates.js');
const { sendEmail } = require("../utils/emailService.js");
const { db } = require('../config/firebase.js');
const ApiError = require('../utils/ApiError.js');
const bcrypt = require('bcryptjs');

// POST /api/reset/sendEmail
async function sendResetEmail(req, res, next) {
    const { email } = req.body;

    try {
        const userQuery = await db.collection('users').where('email', '==', email).get();

        // Don't reveal whether the address is registered — but only actually issue a
        // token and send an email when it is.
        if (!userQuery.empty) {
            const token = jwt.sign({ email: email }, process.env.JWT_SECRET, {expiresIn: '1h'});

            // Stored on the user doc and cleared as soon as it's redeemed, so the link
            // only ever works once — a fresh reset request also invalidates any older link.
            await userQuery.docs[0].ref.update({ passwordResetToken: token });

            const link = `${process.env.FRONTEND_URL}/resetPassword?token=${token}`;
            const { html, text } = passwordResetEmailTemplate(link);

            await sendEmail(email, 'Reset your Dalmarketplace password', text, html);
        }

        res.json({ message: 'Password reset email sent' });
    } catch (err) {
        next(err);
    }
}

// POST api/reset/reset-password changes the user's previous password with the
// one given. The token is single-use: it's checked against what's stored on the
// user's doc and cleared on success, so replaying the same link fails afterward.
async function resetPassword(req, res, next) {
    const { password, token } = req.body;

    try {
        const { email } = jwt.verify(token, process.env.JWT_SECRET);

        const ref = db.collection('users').where("email", "==", email);
        const doc = await ref.get();
        if (doc.empty) {
            throw ApiError.badRequest('User not found');
        }

        const userDoc = doc.docs[0];
        if (userDoc.data().passwordResetToken !== token) {
            throw ApiError.badRequest('This reset link has already been used or is no longer valid');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await userDoc.ref.update({ password: hashedPassword, passwordResetToken: null });

        res.json({ message: 'Password updated'});
    } catch (err) {
        next(err)
    }
}

module.exports = { sendResetEmail, resetPassword };