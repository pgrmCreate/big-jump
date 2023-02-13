const express = require('express');
const router = express.Router();
const GameConfigController = require('../controllers/gameConfig');
const auth = require('../middleware/auth');

router.get('/', auth, GameConfigController.getAll);
router.get('/:id', GameConfigController.get);
router.delete('/:id', auth, GameConfigController.delete);
router.post('/', auth, GameConfigController.create);
router.post('/:id', auth, GameConfigController.update);

module.exports = router;
