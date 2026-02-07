const express = require('express');
const router = express.Router();
const composicaoController = require('../controllers/composicaoController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', composicaoController.getAll);
router.get('/:id', composicaoController.getById);
router.post('/', composicaoController.create);
router.put('/:id', composicaoController.update);
router.delete('/:id', composicaoController.delete);

module.exports = router;
