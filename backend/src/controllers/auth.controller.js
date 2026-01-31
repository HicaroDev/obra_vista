const authService = require('../services/auth.service');
const { validationResult } = require('express-validator');

class AuthController {
  /**
   * POST /api/auth/register
   * Registrar novo usuário
   */
  async register(req, res, next) {
    try {
      // Validar dados
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erro de validação',
          errors: errors.array(),
        });
      }

      const { nome, email, senha, tipo } = req.body;

      // Registrar usuário
      const result = await authService.register({ nome, email, senha, tipo });

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Login de usuário
   */
  async login(req, res, next) {
    try {
      // Validar dados
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erro de validação',
          errors: errors.array(),
        });
      }

      const { email, senha } = req.body;

      // Fazer login
      const result = await authService.login(email, senha);

      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: result,
      });
    } catch (error) {
      // Retornar erro 401 para credenciais inválidas
      if (error.message.includes('incorretos') || error.message.includes('inativo')) {
        return res.status(401).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Buscar dados do usuário logado
   */
  async getMe(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await authService.getMe(userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/profile
   * Atualizar perfil do usuário
   */
  async updateProfile(req, res, next) {
    try {
      // Validar dados
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erro de validação',
          errors: errors.array(),
        });
      }

      const userId = req.user.id;
      const { nome, email, senhaAtual, novaSenha } = req.body;

      const updatedUser = await authService.updateProfile(userId, {
        nome,
        email,
        senhaAtual,
        novaSenha,
      });

      res.status(200).json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/check-email
   * Verificar se email já existe
   */
  async checkEmail(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email é obrigatório',
        });
      }

      const exists = await authService.checkEmailExists(email);

      res.status(200).json({
        success: true,
        data: { exists },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Logout (apenas retorna sucesso, token é removido no frontend)
   */
  async logout(req, res) {
    res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  }
}

module.exports = new AuthController();
