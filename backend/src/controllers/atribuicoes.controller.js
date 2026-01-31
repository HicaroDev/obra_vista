const atribuicoesService = require('../services/atribuicoes.service');
const { validationResult } = require('express-validator');

class AtribuicoesController {
  /**
   * GET /api/atribuicoes
   * Listar todas as atribuições
   */
  async getAll(req, res, next) {
    try {
      const { obraId, equipeId, status, prioridade } = req.query;

      const atribuicoes = await atribuicoesService.getAll({
        obraId,
        equipeId,
        status,
        prioridade,
      });

      res.status(200).json({
        success: true,
        data: atribuicoes,
        count: atribuicoes.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/atribuicoes/:id
   * Buscar atribuição por ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const atribuicao = await atribuicoesService.getById(id);

      res.status(200).json({
        success: true,
        data: atribuicao,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/atribuicoes/obra/:obraId
   * Buscar atribuições por obra
   */
  async getByObra(req, res, next) {
    try {
      const { obraId } = req.params;

      const atribuicoes = await atribuicoesService.getByObra(obraId);

      res.status(200).json({
        success: true,
        data: atribuicoes,
        count: atribuicoes.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/atribuicoes
   * Criar nova atribuição
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
        obraId,
        equipeId,
        prestadorId,
        tipoAtribuicao,
        titulo,
        descricao,
        status,
        prioridade,
        dataInicio,
        dataFim,
        diasSemana,
      } = req.body;

      const userId = req.user.id;

      const atribuicao = await atribuicoesService.create(
        {
          obraId,
          equipeId,
          prestadorId,
          tipoAtribuicao,
          titulo,
          descricao,
          status,
          prioridade,
          dataInicio,
          dataFim,
          diasSemana,
        },
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Atribuição criada com sucesso',
        data: atribuicao,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/atribuicoes/:id
   * Atualizar atribuição
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
        titulo,
        descricao,
        status,
        prioridade,
        dataInicio,
        dataFim,
        equipeId,
        prestadorId,
        tipoAtribuicao,
        diasSemana,
      } = req.body;

      const userId = req.user.id;

      const atribuicao = await atribuicoesService.update(
        id,
        {
          titulo,
          descricao,
          status,
          prioridade,
          dataInicio,
          dataFim,
          equipeId,
          prestadorId,
          tipoAtribuicao,
          diasSemana,
        },
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Atribuição atualizada com sucesso',
        data: atribuicao,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/atribuicoes/:id
   * Deletar atribuição
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await atribuicoesService.delete(id, userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/atribuicoes/:id/status
   * Mudar status da atribuição (drag & drop)
   */
  async changeStatus(req, res, next) {
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
      const { status, ordem } = req.body;
      const userId = req.user.id;

      const atribuicao = await atribuicoesService.changeStatus(
        id,
        status,
        ordem,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Status atualizado com sucesso',
        data: atribuicao,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/atribuicoes/:id/ordem
   * Reordenar atribuição (drag & drop dentro da mesma coluna)
   */
  async reorder(req, res, next) {
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
      const { ordem } = req.body;
      const userId = req.user.id;

      const atribuicao = await atribuicoesService.reorder(id, ordem, userId);

      res.status(200).json({
        success: true,
        message: 'Ordem atualizada com sucesso',
        data: atribuicao,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AtribuicoesController();
