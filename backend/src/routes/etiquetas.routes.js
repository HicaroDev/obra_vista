const express = require('express');
const router = express.Router();
const etiquetasController = require('../controllers/etiquetas.controller');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Rotas de Etiquetas Gerais
router.get('/', etiquetasController.getAll);
router.post('/', etiquetasController.create);
router.delete('/:id', etiquetasController.delete);

// Rotas de Etiquetas por Tarefa
router.get('/tarefa/:id', etiquetasController.getByTarefa);
router.post('/tarefa/:id', etiquetasController.addToTarefa);
router.delete('/tarefa/:id/:etiquetaId', etiquetasController.removeFromTarefa);

module.exports = router;
