const express = require('express');
const router = express.Router();
const insumoController = require('../controllers/insumoController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', insumoController.getAll);
router.get('/:id', insumoController.getById);
router.post('/', insumoController.create);
router.put('/:id', insumoController.update);
router.delete('/:id', insumoController.delete);

module.exports = router;
