const express = require('express');
const userController = require('../controllers/user');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/login', userController.login)
router.post('/signup', userController.signup);
router.get('/reconnect', userController.reconnect);

module.exports = router;
