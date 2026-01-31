const logsService = require('../services/logs.service');

class LogsController {
  /**
   * GET /api/logs
   * Listar todos os logs
   */
  async getAll(req, res, next) {
    try {
      const { usuarioId, atribuicaoId, entidade, acao, limit } = req.query;

      const logs = await logsService.getAll({
        usuarioId,
        atribuicaoId,
        entidade,
        acao,
        limit,
      });

      res.status(200).json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/logs/usuario/:usuarioId
   * Buscar logs por usuário
   */
  async getByUsuario(req, res, next) {
    try {
      const { usuarioId } = req.params;
      const { limit } = req.query;

      const logs = await logsService.getByUsuario(usuarioId, limit);

      res.status(200).json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/logs/atribuicao/:atribuicaoId
   * Buscar logs por atribuição
   */
  async getByAtribuicao(req, res, next) {
    try {
      const { atribuicaoId } = req.params;

      const logs = await logsService.getByAtribuicao(atribuicaoId);

      res.status(200).json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/logs/entidade/:entidade
   * Buscar logs por entidade
   */
  async getByEntidade(req, res, next) {
    try {
      const { entidade } = req.params;
      const { limit } = req.query;

      const logs = await logsService.getByEntidade(entidade, limit);

      res.status(200).json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/logs/estatisticas
   * Buscar estatísticas de logs
   */
  async getEstatisticas(req, res, next) {
    try {
      const { usuarioId, startDate, endDate } = req.query;

      const estatisticas = await logsService.getEstatisticas({
        usuarioId,
        startDate,
        endDate,
      });

      res.status(200).json({
        success: true,
        data: estatisticas,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/logs/limpar
   * Limpar logs antigos (apenas admin)
   */
  async limparLogsAntigos(req, res, next) {
    try {
      const { dias } = req.query;

      const result = await logsService.limparLogsAntigos(dias);

      res.status(200).json({
        success: true,
        message: result.message,
        data: { count: result.count },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LogsController();
