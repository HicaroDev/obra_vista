const express = require('express');
const router = express.Router();
const unidadesController = require('../controllers/unidades.controller');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', unidadesController.create);
router.get('/', unidadesController.getAll);
router.put('/:id', unidadesController.update);
router.delete('/:id', unidadesController.delete);

module.exports = router;
