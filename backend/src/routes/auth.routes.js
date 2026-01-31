const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar novo usuário
 * @access  Public
 */
router.post(
  '/register',
  [
    body('nome')
      .trim()
      .notEmpty()
      .withMessage('Nome é obrigatório')
      .isLength({ min: 3 })
      .withMessage('Nome deve ter no mínimo 3 caracteres'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email é obrigatório')
      .isEmail()
      .withMessage('Email inválido')
      .normalizeEmail(),
    body('senha')
      .notEmpty()
      .withMessage('Senha é obrigatória')
      .isLength({ min: 6 })
      .withMessage('Senha deve ter no mínimo 6 caracteres'),
    body('tipo')
      .optional()
      .isIn(['admin', 'usuario'])
      .withMessage('Tipo deve ser "admin" ou "usuario"'),
  ],
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuário
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email é obrigatório')
      .isEmail()
      .withMessage('Email inválido')
      .normalizeEmail(),
    body('senha')
      .notEmpty()
      .withMessage('Senha é obrigatória'),
  ],
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Buscar dados do usuário logado
 * @access  Private
 */
router.get('/me', authMiddleware, authController.getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Atualizar perfil do usuário
 * @access  Private
 */
router.put(
  '/profile',
  authMiddleware,
  [
    body('nome')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Nome deve ter no mínimo 3 caracteres'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Email inválido')
      .normalizeEmail(),
    body('novaSenha')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Nova senha deve ter no mínimo 6 caracteres'),
    body('senhaAtual')
      .if(body('novaSenha').exists())
      .notEmpty()
      .withMessage('Senha atual é obrigatória para alterar a senha'),
  ],
  authController.updateProfile
);

/**
 * @route   POST /api/auth/check-email
 * @desc    Verificar se email já existe
 * @access  Public
 */
router.post('/check-email', authController.checkEmail);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (token removido no frontend)
 * @access  Private
 */
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
