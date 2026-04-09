const express = require('express');
const router = express.Router();
const { getUsers, getUser, updateUserRole, deleteUser } = require('../controllers/user.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', adminOnly, getUsers);
router.get('/:id', getUser);
router.patch('/:id/role', adminOnly, updateUserRole);
router.delete('/:id', adminOnly, deleteUser);

module.exports = router;
