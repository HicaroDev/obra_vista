const express = require('express');
const { body } = require('express-validator');
const equipesController = require('../controllers/equipes.controller');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de equipes requerem autenticação
router.use(authMiddleware);

/**
 * @route   GET /api/equipes
 * @desc    Listar todas as equipes
 * @access  Private
 * @query   ativa (boolean), search (string)
 */
router.get('/', equipesController.getAll);

/**
 * @route   GET /api/equipes/:id
 * @desc    Buscar equipe por ID
 * @access  Private
 */
router.get('/:id', equipesController.getById);

/**
 * @route   POST /api/equipes
 * @desc    Criar nova equipe
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
    body('descricao')
      .optional()
      .trim(),
    body('cor')
      .optional()
      .matches(/^#[0-9A-F]{6}$/i)
      .withMessage('Cor deve estar no formato hexadecimal (#RRGGBB)'),
    body('membros')
      .optional()
      .isArray()
      .withMessage('Membros deve ser um array'),
    body('membros.*.usuarioId')
      .optional()
      .isInt()
      .withMessage('ID do usuário deve ser um número inteiro'),
    body('membros.*.prestadorId')
      .optional()
      .isInt()
      .withMessage('ID do prestador deve ser um número inteiro'),
    body('membros.*.papel')
      .optional()
      .isIn(['lider', 'membro'])
      .withMessage('Papel deve ser "lider" ou "membro"'),
  ],
  equipesController.create
);

/**
 * @route   PUT /api/equipes/:id
 * @desc    Atualizar equipe
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
    body('descricao')
      .optional()
      .trim(),
    body('cor')
      .optional()
      .matches(/^#[0-9A-F]{6}$/i)
      .withMessage('Cor deve estar no formato hexadecimal (#RRGGBB)'),
    body('ativa')
      .optional()
      .isBoolean()
      .withMessage('Ativa deve ser um valor booleano'),
  ],
  equipesController.update
);

/**
 * @route   DELETE /api/equipes/:id
 * @desc    Deletar equipe
 * @access  Private
 */
router.delete('/:id', equipesController.delete);

/**
 * @route   POST /api/equipes/:id/membros
 * @desc    Adicionar membro à equipe
 * @access  Private
 */
router.post(
  '/:id/membros',
  [
    body('usuarioId')
      .optional()
      .isInt()
      .withMessage('ID do usuário deve ser um número inteiro'),
    body('prestadorId')
      .optional()
      .isInt()
      .withMessage('ID do prestador deve ser um número inteiro'),
    body('papel')
      .optional()
      .isIn(['lider', 'membro'])
      .withMessage('Papel deve ser "lider" ou "membro"'),
  ],
  equipesController.addMembro
);

/**
 * @route   DELETE /api/equipes/:id/membros/:membroId
 * @desc    Remover membro da equipe
 * @access  Private
 */
router.delete('/:id/membros/:membroId', equipesController.removeMembro);

/**
 * @route   PATCH /api/equipes/:id/membros/:membroId
 * @desc    Atualizar papel do membro
 * @access  Private
 */
router.patch(
  '/:id/membros/:membroId',
  [
    body('papel')
      .notEmpty()
      .withMessage('Papel é obrigatório')
      .isIn(['lider', 'membro'])
      .withMessage('Papel deve ser "lider" ou "membro"'),
  ],
  equipesController.updateMembroPapel
);

module.exports = router;
