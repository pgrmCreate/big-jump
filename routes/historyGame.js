const express = require('express');
const router = express.Router();
const HistoryGameController = require('../controllers/historyGame');
const auth = require('../middleware/auth');

router.get('/', auth, HistoryGameController.getAll);
router.post('/', auth, HistoryGameController.create);

module.exports = router;
