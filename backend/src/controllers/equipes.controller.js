const equipesService = require('../services/equipes.service');
const { validationResult } = require('express-validator');

class EquipesController {
  /**
   * GET /api/equipes
   * Listar todas as equipes
   */
  async getAll(req, res, next) {
    try {
      const { ativa, search } = req.query;

      const equipes = await equipesService.getAll({ ativa, search });

      res.status(200).json({
        success: true,
        data: equipes,
        count: equipes.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/equipes/:id
   * Buscar equipe por ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const equipe = await equipesService.getById(id);

      res.status(200).json({
        success: true,
        data: equipe,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/equipes
   * Criar nova equipe
   */
  async create(req, res, next) {
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

      const { nome, descricao, cor, membros } = req.body;

      const equipe = await equipesService.create({
        nome,
        descricao,
        cor,
        membros,
      });

      res.status(201).json({
        success: true,
        message: 'Equipe criada com sucesso',
        data: equipe,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/equipes/:id
   * Atualizar equipe
   */
  async update(req, res, next) {
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

      const { id } = req.params;
      const { nome, descricao, cor, ativa } = req.body;

      const equipe = await equipesService.update(id, {
        nome,
        descricao,
        cor,
        ativa,
      });

      res.status(200).json({
        success: true,
        message: 'Equipe atualizada com sucesso',
        data: equipe,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/equipes/:id
   * Deletar equipe
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const result = await equipesService.delete(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/equipes/:id/membros
   * Adicionar membro à equipe
   */
  async addMembro(req, res, next) {
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

      const { id } = req.params;
      const { usuarioId, prestadorId, papel } = req.body;

      const membro = await equipesService.addMembro(id, {
        usuarioId,
        prestadorId,
        papel,
      });

      res.status(201).json({
        success: true,
        message: 'Membro adicionado à equipe com sucesso',
        data: membro,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/equipes/:id/membros/:membroId
   * Remover membro da equipe
   */
  async removeMembro(req, res, next) {
    try {
      const { id, membroId } = req.params;

      const result = await equipesService.removeMembro(id, membroId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/equipes/:id/membros/:membroId
   * Atualizar papel do membro
   */
  async updateMembroPapel(req, res, next) {
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

      const { id, membroId } = req.params;
      const { papel } = req.body;

      const membro = await equipesService.updateMembroPapel(id, membroId, papel);

      res.status(200).json({
        success: true,
        message: 'Papel do membro atualizado com sucesso',
        data: membro,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EquipesController();
