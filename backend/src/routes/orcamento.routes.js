const express = require('express');
const router = express.Router();
const orcamentoController = require('../controllers/orcamentoController');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authMiddleware);

router.get('/templates', orcamentoController.getTemplates);
router.post('/templates/save-as', orcamentoController.saveAsTemplate);
router.post('/templates/create-from-template', orcamentoController.createFromTemplate);
router.post('/:obraId/importar', upload.single('file'), orcamentoController.importarOrcamento);
router.get('/:obraId', orcamentoController.getOrcamento);

module.exports = router;
