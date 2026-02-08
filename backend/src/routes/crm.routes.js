const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmController');
const { authMiddleware } = require('../middleware/auth');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// ==================== LEADS ====================
router.get('/leads', crmController.getLeads);
router.get('/leads/:id', crmController.getLeadById);
router.post('/leads', crmController.createLead);
router.put('/leads/:id', crmController.updateLead);
router.delete('/leads/:id', crmController.deleteLead);

// ==================== DEALS ====================
router.get('/deals', crmController.getDeals);
router.get('/deals/:id', crmController.getDealById);
router.post('/deals', crmController.createDeal);
router.put('/deals/:id', crmController.updateDeal);
router.patch('/deals/:id/estagio', crmController.updateDealStage);
router.patch('/deals/:id/win', crmController.winDeal);
router.patch('/deals/:id/lose', crmController.loseDeal);
router.delete('/deals/:id', crmController.deleteDeal);

// ==================== PROPOSTAS ====================
router.post('/propostas', crmController.createProposta);
router.get('/deals/:dealId/propostas', crmController.getPropostasByDeal);

// ==================== INTERAÇÕES ====================
router.get('/deals/:dealId/interacoes', crmController.getInteracoesByDeal);
router.post('/interacoes', crmController.createInteracao);

// ==================== VISTORIA ====================
router.get('/perguntas', crmController.getPerguntas);
router.get('/deals/:dealId/vistoria', crmController.getVistoriaByDeal);
router.post('/vistoria', crmController.createOrUpdateVistoria);

// Indicadores e PDF
router.get('/stats', crmController.getStats);
router.get('/propostas/:id/pdf', crmController.generatePropostaPDF);

module.exports = router;
