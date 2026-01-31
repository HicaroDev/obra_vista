const express = require('express');
const router = express.Router();
const produtosController = require('../controllers/produtos.controller');
const { authMiddleware } = require('../middleware/auth');

// Rotas protegidas sem verificação de role específica (acessível a qualquer usuário autênticado)
router.use(authMiddleware);

router.post('/', produtosController.create);
router.get('/', produtosController.getAll);
router.get('/search', produtosController.search);
router.put('/:id', produtosController.update);
router.delete('/:id', produtosController.delete);

module.exports = router;
