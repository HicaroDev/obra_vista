const obrasService = require('../services/obras.service');
const { validationResult } = require('express-validator');

class ObrasController {
  /**
   * GET /api/obras
   * Listar todas as obras
   */
  async getAll(req, res, next) {
    try {
      const { status, search } = req.query;

      const obras = await obrasService.getAll({ status, search });

      res.status(200).json({
        success: true,
        data: obras,
        count: obras.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/obras/:id
   * Buscar obra por ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const obra = await obrasService.getById(id);

      res.status(200).json({
        success: true,
        data: obra,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/obras
   * Criar nova obra
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

      const {
        nome,
        endereco,
        descricao,
        status,
        dataInicio,
        dataFim,
        orcamento,
      } = req.body;

      const obra = await obrasService.create({
        nome,
        endereco,
        descricao,
        status,
        dataInicio,
        dataFim,
        orcamento,
      });

      res.status(201).json({
        success: true,
        message: 'Obra criada com sucesso',
        data: obra,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/obras/:id
   * Atualizar obra
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
      const {
        nome,
        endereco,
        descricao,
        status,
        dataInicio,
        dataFim,
        orcamento,
      } = req.body;

      const obra = await obrasService.update(id, {
        nome,
        endereco,
        descricao,
        status,
        dataInicio,
        dataFim,
        orcamento,
      });

      res.status(200).json({
        success: true,
        message: 'Obra atualizada com sucesso',
        data: obra,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/obras/:id
   * Deletar obra
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const result = await obrasService.delete(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/obras/:id/kanban
   * Buscar dados do Kanban da obra
   */
  async getKanban(req, res, next) {
    try {
      const { id } = req.params;

      const kanban = await obrasService.getKanban(id);

      res.status(200).json({
        success: true,
        data: kanban,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/obras/:id/estatisticas
   * Buscar estatísticas da obra
   */
  async getEstatisticas(req, res, next) {
    try {
      const { id } = req.params;

      const estatisticas = await obrasService.getEstatisticas(id);

      res.status(200).json({
        success: true,
        data: estatisticas,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ObrasController();
