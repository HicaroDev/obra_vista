const prisma = require('../config/database');

class LogsService {
  /**
   * Listar todos os logs
   */
  async getAll(filters = {}) {
    const { usuarioId, atribuicaoId, entidade, acao, limit = 50 } = filters;

    const where = {};

    if (usuarioId) where.usuarioId = parseInt(usuarioId);
    if (atribuicaoId) where.atribuicaoId = parseInt(atribuicaoId);
    if (entidade) where.entidade = entidade;
    if (acao) where.acao = acao;

    const logs = await prisma.logs.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        atribuicao: {
          select: {
            id: true,
            titulo: true,
            obra: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    return logs;
  }

  /**
   * Buscar logs por usuário
   */
  async getByUsuario(usuarioId, limit = 50) {
    const logs = await prisma.logs.findMany({
      where: { usuarioId: parseInt(usuarioId) },
      include: {
        atribuicao: {
          select: {
            id: true,
            titulo: true,
            obra: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    return logs;
  }

  /**
   * Buscar logs por atribuição
   */
  async getByAtribuicao(atribuicaoId) {
    const logs = await prisma.logs.findMany({
      where: { atribuicaoId: parseInt(atribuicaoId) },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return logs;
  }

  /**
   * Buscar logs por entidade
   */
  async getByEntidade(entidade, limit = 50) {
    const logs = await prisma.logs.findMany({
      where: { entidade },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        atribuicao: {
          select: {
            id: true,
            titulo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    return logs;
  }

  /**
   * Buscar estatísticas de logs
   */
  async getEstatisticas(filters = {}) {
    const { usuarioId, startDate, endDate } = filters;

    const where = {};

    if (usuarioId) where.usuarioId = parseInt(usuarioId);

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const logs = await prisma.logs.findMany({
      where,
      select: {
        acao: true,
        entidade: true,
      },
    });

    const estatisticas = {
      total: logs.length,
      porAcao: {
        criou: logs.filter((l) => l.acao === 'criou').length,
        atualizou: logs.filter((l) => l.acao === 'atualizou').length,
        deletou: logs.filter((l) => l.acao === 'deletou').length,
        moveu: logs.filter((l) => l.acao === 'moveu').length,
        reordenou: logs.filter((l) => l.acao === 'reordenou').length,
      },
      porEntidade: {
        obra: logs.filter((l) => l.entidade === 'obra').length,
        equipe: logs.filter((l) => l.entidade === 'equipe').length,
        atribuicao: logs.filter((l) => l.entidade === 'atribuicao').length,
      },
    };

    return estatisticas;
  }

  /**
   * Limpar logs antigos (manutenção)
   */
  async limparLogsAntigos(diasParaManter = 90) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasParaManter);

    const result = await prisma.logs.deleteMany({
      where: {
        createdAt: {
          lt: dataLimite,
        },
      },
    });

    return {
      message: `${result.count} logs antigos foram removidos`,
      count: result.count,
    };
  }
}

module.exports = new LogsService();
