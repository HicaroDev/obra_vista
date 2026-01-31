const express = require('express');
const router = express.Router();
const checklistsService = require('../services/checklists.service');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Listar por tarefa
router.get('/tarefa/:atribuicaoId', async (req, res) => {
    try {
        const data = await checklistsService.getByAtribuicao(req.params.atribuicaoId);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Criar
router.post('/tarefa/:atribuicaoId', async (req, res) => {
    try {
        const data = await checklistsService.create(req.params.atribuicaoId, req.body);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Atualizar
router.put('/:id', async (req, res) => {
    try {
        const data = await checklistsService.update(req.params.id, req.body);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Deletar
router.delete('/:id', async (req, res) => {
    try {
        await checklistsService.delete(req.params.id);
        res.json({ success: true, message: 'Item removido' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
