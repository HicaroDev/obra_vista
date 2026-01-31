const express = require('express');
const { body } = require('express-validator');
const atribuicoesController = require('../controllers/atribuicoes.controller');
const anexosController = require('../controllers/anexos.controller');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const uploadConfig = require('../config/upload');

const upload = multer(uploadConfig);

const router = express.Router();

// Todas as rotas de atribuições requerem autenticação
router.use(authMiddleware);

/**
 * @route   GET /api/atribuicoes
 * @desc    Listar todas as atribuições
 * @access  Private
 * @query   obraId, equipeId, status, prioridade
 */
router.get('/', atribuicoesController.getAll);

/**
 * @route   GET /api/atribuicoes/obra/:obraId
 * @desc    Buscar atribuições por obra
 * @access  Private
 */
router.get('/obra/:obraId', atribuicoesController.getByObra);

/**
 * @route   GET /api/atribuicoes/:id
 * @desc    Buscar atribuição por ID
 * @access  Private
 */
router.get('/:id', atribuicoesController.getById);

/**
 * @route   POST /api/atribuicoes
 * @desc    Criar nova atribuição
 * @access  Private
 */
router.post(
  '/',
  [
    body('obraId')
      .notEmpty()
      .withMessage('ID da obra é obrigatório')
      .isInt()
      .withMessage('ID da obra deve ser um número inteiro'),
    body('equipeId')
      .optional({ nullable: true })
      .isInt()
      .withMessage('ID da equipe deve ser um número inteiro'),
    body('prestadorId')
      .optional({ nullable: true })
      .isInt()
      .withMessage('ID do prestador deve ser um número inteiro'),
    body('tipoAtribuicao')
      .optional()
      .isIn(['equipe', 'prestador'])
      .withMessage('Tipo de atribuição inválido'),
    body('diasSemana')
      .optional()
      .isArray()
      .withMessage('Dias da semana deve ser um array'),
    body('titulo')
      .trim()
      .notEmpty()
      .withMessage('Título é obrigatório')
      .isLength({ min: 3 })
      .withMessage('Título deve ter no mínimo 3 caracteres'),
    body('descricao')
      .optional()
      .trim(),
    body('status')
      .optional()
      .isIn(['a_fazer', 'em_progresso', 'concluido'])
      .withMessage('Status inválido'),
    body('prioridade')
      .optional()
      .isIn(['baixa', 'media', 'alta', 'urgente'])
      .withMessage('Prioridade inválida'),
    body('dataInicio')
      .optional()
      .isISO8601()
      .withMessage('Data de início inválida'),
    body('dataFim')
      .optional()
      .isISO8601()
      .withMessage('Data de fim inválida'),
  ],
  atribuicoesController.create
);

/**
 * @route   PUT /api/atribuicoes/:id
 * @desc    Atualizar atribuição
 * @access  Private
 */
router.put(
  '/:id',
  [
    body('titulo')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Título deve ter no mínimo 3 caracteres'),
    body('descricao')
      .optional()
      .trim(),
    body('status')
      .optional()
      .isIn(['a_fazer', 'em_progresso', 'concluido'])
      .withMessage('Status inválido'),
    body('prioridade')
      .optional()
      .isIn(['baixa', 'media', 'alta', 'urgente'])
      .withMessage('Prioridade inválida'),
    body('dataInicio')
      .optional()
      .isISO8601()
      .withMessage('Data de início inválida'),
    body('dataFim')
      .optional()
      .isISO8601()
      .withMessage('Data de fim inválida'),
    body('equipeId')
      .optional({ nullable: true })
      .isInt()
      .withMessage('ID da equipe deve ser um número inteiro'),
    body('prestadorId')
      .optional({ nullable: true })
      .isInt()
      .withMessage('ID do prestador deve ser um número inteiro'),
    body('tipoAtribuicao')
      .optional()
      .isIn(['equipe', 'prestador'])
      .withMessage('Tipo de atribuição inválido'),
    body('diasSemana')
      .optional()
      .isArray()
      .withMessage('Dias da semana deve ser um array'),
  ],
  atribuicoesController.update
);

/**
 * @route   DELETE /api/atribuicoes/:id
 * @desc    Deletar atribuição
 * @access  Private
 */
router.delete('/:id', atribuicoesController.delete);

/**
 * @route   PATCH /api/atribuicoes/:id/status
 * @desc    Mudar status da atribuição (drag & drop)
 * @access  Private
 */
router.patch(
  '/:id/status',
  [
    body('status')
      .notEmpty()
      .withMessage('Status é obrigatório')
      .isIn(['a_fazer', 'em_progresso', 'concluido'])
      .withMessage('Status inválido'),
    body('ordem')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Ordem deve ser um número inteiro positivo'),
  ],
  atribuicoesController.changeStatus
);

/**
 * @route   PATCH /api/atribuicoes/:id/ordem
 * @desc    Reordenar atribuição (drag & drop dentro da mesma coluna)
 * @access  Private
 */
router.patch(
  '/:id/ordem',
  [
    body('ordem')
      .notEmpty()
      .withMessage('Ordem é obrigatória')
      .isInt({ min: 0 })
      .withMessage('Ordem deve ser um número inteiro positivo'),
  ],
  atribuicoesController.reorder
);

/**
 * ==========================================
 * ROTAS DE ANEXOS
 * ==========================================
 */

/**
 * @route   GET /api/atribuicoes/:id/anexos
 * @desc    Listar anexos de uma atribuição
 * @access  Private
 */
router.get('/:id/anexos', anexosController.getByAtribuicao);

/**
 * @route   POST /api/atribuicoes/:id/anexos
 * @desc    Upload de anexo para uma atribuição
 * @access  Private
 */
router.post('/:id/anexos', upload.single('file'), anexosController.upload);

module.exports = router;
