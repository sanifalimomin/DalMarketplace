const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getUser, getUsers, getMe, updateMe, changePassword } = require('../controllers/userController');

router.get('/', authMiddleware, getUsers);
// Static paths must precede the '/:id' param route, or Express captures them as an id.
router.get('/me', authMiddleware, getMe);
router.patch('/me', authMiddleware, updateMe);
router.patch('/me/password', authMiddleware, changePassword);
router.get('/:id', authMiddleware, getUser);

module.exports = router;
