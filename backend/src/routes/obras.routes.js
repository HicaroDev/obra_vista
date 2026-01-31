const express = require('express');
const { body } = require('express-validator');
const obrasController = require('../controllers/obras.controller');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de obras requerem autenticação
router.use(authMiddleware);

/**
 * @route   GET /api/obras
 * @desc    Listar todas as obras
 * @access  Private
 * @query   status (string), search (string)
 */
router.get('/', obrasController.getAll);

/**
 * @route   GET /api/obras/:id
 * @desc    Buscar obra por ID
 * @access  Private
 */
router.get('/:id', obrasController.getById);

/**
 * @route   GET /api/obras/:id/kanban
 * @desc    Buscar dados do Kanban da obra
 * @access  Private
 */
router.get('/:id/kanban', obrasController.getKanban);

/**
 * @route   GET /api/obras/:id/estatisticas
 * @desc    Buscar estatísticas da obra
 * @access  Private
 */
router.get('/:id/estatisticas', obrasController.getEstatisticas);

/**
 * @route   POST /api/obras
 * @desc    Criar nova obra
 * @access  Private
 */
router.post(
  '/',
  [
    body('nome')
      .trim()
      .notEmpty()
      .withMessage('Nome é obrigatório')
      .isLength({ min: 3 })
      .withMessage('Nome deve ter no mínimo 3 caracteres'),
    body('endereco')
      .trim()
      .notEmpty()
      .withMessage('Endereço é obrigatório'),
    body('descricao')
      .optional()
      .trim(),
    body('status')
      .optional()
      .isIn(['planejamento', 'em_andamento', 'concluido', 'pausado'])
      .withMessage('Status inválido'),
    body('dataInicio')
      .optional()
      .isISO8601()
      .withMessage('Data de início inválida'),
    body('dataFim')
      .optional()
      .isISO8601()
      .withMessage('Data de fim inválida'),
    body('orcamento')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Orçamento deve ser um número positivo'),
  ],
  obrasController.create
);

/**
 * @route   PUT /api/obras/:id
 * @desc    Atualizar obra
 * @access  Private
 */
router.put(
  '/:id',
  [
    body('nome')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Nome deve ter no mínimo 3 caracteres'),
    body('endereco')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Endereço não pode ser vazio'),
    body('descricao')
      .optional()
      .trim(),
    body('status')
      .optional()
      .isIn(['planejamento', 'em_andamento', 'concluido', 'pausado'])
      .withMessage('Status inválido'),
    body('dataInicio')
      .optional()
      .isISO8601()
      .withMessage('Data de início inválida'),
    body('dataFim')
      .optional()
      .isISO8601()
      .withMessage('Data de fim inválida'),
    body('orcamento')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Orçamento deve ser um número positivo'),
  ],
  obrasController.update
);

/**
 * @route   DELETE /api/obras/:id
 * @desc    Deletar obra
 * @access  Private
 */
router.delete('/:id', obrasController.delete);

module.exports = router;
