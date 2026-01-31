const express = require('express');
const logsController = require('../controllers/logs.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de logs requerem autenticação
router.use(authMiddleware);

/**
 * @route   GET /api/logs
 * @desc    Listar todos os logs
 * @access  Private
 * @query   usuarioId, atribuicaoId, entidade, acao, limit
 */
router.get('/', logsController.getAll);

/**
 * @route   GET /api/logs/estatisticas
 * @desc    Buscar estatísticas de logs
 * @access  Private
 * @query   usuarioId, startDate, endDate
 */
router.get('/estatisticas', logsController.getEstatisticas);

/**
 * @route   GET /api/logs/usuario/:usuarioId
 * @desc    Buscar logs por usuário
 * @access  Private
 * @query   limit
 */
router.get('/usuario/:usuarioId', logsController.getByUsuario);

/**
 * @route   GET /api/logs/atribuicao/:atribuicaoId
 * @desc    Buscar logs por atribuição
 * @access  Private
 */
router.get('/atribuicao/:atribuicaoId', logsController.getByAtribuicao);

/**
 * @route   GET /api/logs/entidade/:entidade
 * @desc    Buscar logs por entidade
 * @access  Private
 * @query   limit
 */
router.get('/entidade/:entidade', logsController.getByEntidade);

/**
 * @route   DELETE /api/logs/limpar
 * @desc    Limpar logs antigos (apenas admin)
 * @access  Private (Admin only)
 * @query   dias (default: 90)
 */
router.delete('/limpar', adminMiddleware, logsController.limparLogsAntigos);

module.exports = router;
