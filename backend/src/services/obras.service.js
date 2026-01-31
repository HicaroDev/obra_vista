const prisma = require('../config/database');

class ObrasService {
  /**
   * Listar todas as obras
   */
  async getAll(filters = {}) {
    const { status, search } = filters;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { endereco: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    const obras = await prisma.obras.findMany({
      where,
      include: {
        _count: {
          select: {
            atribuicoes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return obras;
  }

  /**
   * Buscar obra por ID
   */
  async getById(id) {
    const obra = await prisma.obras.findUnique({
      where: { id: parseInt(id) },
      include: {
        atribuicoes: {
          include: {
            equipe: {
              select: {
                id: true,
                nome: true,
                cor: true,
              },
            },
          },
          orderBy: [
            { status: 'asc' },
            { ordem: 'asc' },
          ],
        },
        _count: {
          select: {
            atribuicoes: true,
          },
        },
      },
    });

    if (!obra) {
      throw new Error('Obra não encontrada');
    }

    return obra;
  }

  /**
   * Criar nova obra
   */
  async create(data) {
    const {
      nome,
      endereco,
      descricao,
      status,
      dataInicio,
      dataFim,
      orcamento,
    } = data;

    const obra = await prisma.obras.create({
      data: {
        nome,
        endereco,
        descricao,
        status: status || 'planejamento',
        dataInicio: dataInicio ? new Date(dataInicio) : null,
        dataFim: dataFim ? new Date(dataFim) : null,
        orcamento: orcamento ? parseFloat(orcamento) : null,
      },
    });

    return obra;
  }

  /**
   * Atualizar obra
   */
  async update(id, data) {
    const {
      nome,
      endereco,
      descricao,
      status,
      dataInicio,
      dataFim,
      orcamento,
    } = data;

    // Verificar se obra existe
    await this.getById(id);

    const obra = await prisma.obras.update({
      where: { id: parseInt(id) },
      data: {
        ...(nome && { nome }),
        ...(endereco && { endereco }),
        ...(descricao !== undefined && { descricao }),
        ...(status && { status }),
        ...(dataInicio !== undefined && {
          dataInicio: dataInicio ? new Date(dataInicio) : null,
        }),
        ...(dataFim !== undefined && {
          dataFim: dataFim ? new Date(dataFim) : null,
        }),
        ...(orcamento !== undefined && {
          orcamento: orcamento ? parseFloat(orcamento) : null,
        }),
      },
    });

    return obra;
  }

  /**
   * Deletar obra
   */
  async delete(id) {
    // Verificar se obra existe
    await this.getById(id);

    await prisma.obras.delete({
      where: { id: parseInt(id) },
    });

    return { message: 'Obra deletada com sucesso' };
  }

  /**
   * Buscar dados do Kanban da obra
   */
  async getKanban(id) {
    // Verificar se obra existe
    const obra = await this.getById(id);

    // Buscar atribuições agrupadas por status
    const atribuicoes = await prisma.atribuicoes.findMany({
      where: { obraId: parseInt(id) },
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
            cor: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { ordem: 'asc' },
      ],
    });

    // Agrupar por status
    const kanban = {
      obra: {
        id: obra.id,
        nome: obra.nome,
        status: obra.status,
      },
      colunas: {
        a_fazer: atribuicoes.filter((a) => a.status === 'a_fazer'),
        em_progresso: atribuicoes.filter((a) => a.status === 'em_progresso'),
        concluido: atribuicoes.filter((a) => a.status === 'concluido'),
      },
      estatisticas: {
        total: atribuicoes.length,
        a_fazer: atribuicoes.filter((a) => a.status === 'a_fazer').length,
        em_progresso: atribuicoes.filter((a) => a.status === 'em_progresso').length,
        concluido: atribuicoes.filter((a) => a.status === 'concluido').length,
      },
    };

    return kanban;
  }

  /**
   * Buscar estatísticas da obra
   */
  async getEstatisticas(id) {
    // Verificar se obra existe
    await this.getById(id);

    const atribuicoes = await prisma.atribuicoes.findMany({
      where: { obraId: parseInt(id) },
      select: {
        status: true,
        prioridade: true,
      },
    });

    const estatisticas = {
      total: atribuicoes.length,
      porStatus: {
        a_fazer: atribuicoes.filter((a) => a.status === 'a_fazer').length,
        em_progresso: atribuicoes.filter((a) => a.status === 'em_progresso').length,
        concluido: atribuicoes.filter((a) => a.status === 'concluido').length,
      },
      porPrioridade: {
        baixa: atribuicoes.filter((a) => a.prioridade === 'baixa').length,
        media: atribuicoes.filter((a) => a.prioridade === 'media').length,
        alta: atribuicoes.filter((a) => a.prioridade === 'alta').length,
        urgente: atribuicoes.filter((a) => a.prioridade === 'urgente').length,
      },
      progresso:
        atribuicoes.length > 0
          ? Math.round(
              (atribuicoes.filter((a) => a.status === 'concluido').length /
                atribuicoes.length) *
                100
            )
          : 0,
    };

    return estatisticas;
  }
}

module.exports = new ObrasService();
