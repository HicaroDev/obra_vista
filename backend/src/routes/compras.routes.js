const express = require('express');
const router = express.Router();
const comprasController = require('../controllers/compras.controller');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Rotas vinculadas à tarefa (atribuicao)
// GET /api/compras/tarefa/:id - Listar compras de uma tarefa
router.get('/tarefa/:id', comprasController.listByTarefa);

// POST /api/compras/tarefa/:id - Criar solicitação de compra para uma tarefa
router.post('/tarefa/:id', comprasController.create);

// Rotas diretas do recurso compra
// PUT /api/compras/:id - Atualizar compra
router.put('/:id', comprasController.update);

// DELETE /api/compras/:id - Deletar compra
router.delete('/:id', comprasController.delete);

// PATCH /api/compras/:id/status - Atualizar status da compra
router.patch('/:id/status', comprasController.updateStatus);

module.exports = router;
