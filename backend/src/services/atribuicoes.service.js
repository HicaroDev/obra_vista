const prisma = require('../config/database');

class AtribuicoesService {
  /**
   * Listar todas as atribuições
   */
  async getAll(filters = {}) {
    const { obraId, equipeId, status, prioridade } = filters;

    const where = {};

    if (obraId) where.obraId = parseInt(obraId);
    if (equipeId) where.equipeId = parseInt(equipeId);
    if (status) where.status = status;
    if (prioridade) where.prioridade = prioridade;

    const atribuicoes = await prisma.atribuicoes.findMany({
      where,
      include: {
        obra: {
          select: {
            id: true,
            nome: true,
            status: true,
          },
        },
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
        { createdAt: 'desc' },
      ],
    });

    return atribuicoes;
  }

  /**
   * Buscar atribuição por ID
   */
  async getById(id) {
    const atribuicao = await prisma.atribuicoes.findUnique({
      where: { id: parseInt(id) },
      include: {
        obra: {
          select: {
            id: true,
            nome: true,
            endereco: true,
            status: true,
          },
        },
        equipe: {
          select: {
            id: true,
            nome: true,
            cor: true,
            membros: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    nome: true,
                    email: true,
                  },
                },
                prestador: {
                  select: {
                    id: true,
                    nome: true,
                    especialidade: true,
                  },
                },
              },
            },
          },
        },
        prestador: {
          select: {
            id: true,
            nome: true,
            especialidade: true,
          },
        },
        tarefa_checklists: {
          orderBy: { ordem: 'asc' },
        },
        logs: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!atribuicao) {
      throw new Error('Atribuição não encontrada');
    }

    return atribuicao;
  }

  /**
   * Buscar atribuições por obra
   */
  async getByObra(obraId) {
    const atribuicoes = await prisma.atribuicoes.findMany({
      where: { obraId: parseInt(obraId) },
      include: {
        equipe: {
          select: { id: true, nome: true, cor: true },
        },
        prestador: {
          select: { id: true, nome: true, especialidade: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { ordem: 'asc' },
      ],
    });

    return atribuicoes;
  }

  /**
   * Criar nova atribuição
   */
  async create(data, userId) {
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
    } = data;

    // Verificar se obra existe
    const obra = await prisma.obras.findUnique({
      where: { id: parseInt(obraId) },
    });

    if (!obra) {
      throw new Error('Obra não encontrada');
    }

    // Verificar se equipe existe (se fornecido)
    let equipe = null;
    if (equipeId) {
      equipe = await prisma.equipes.findUnique({
        where: { id: parseInt(equipeId) },
      });
      if (!equipe) throw new Error('Equipe não encontrada');
    }

    // Verificar se prestador existe (se fornecido)
    let prestador = null;
    if (prestadorId) {
      prestador = await prisma.prestadores.findUnique({
        where: { id: parseInt(prestadorId) },
      });
      if (!prestador) throw new Error('Prestador não encontrado');
    }

    // Buscar maior ordem atual para o status
    const maxOrdem = await prisma.atribuicoes.findFirst({
      where: {
        obraId: parseInt(obraId),
        status: status || 'a_fazer',
      },
      orderBy: { ordem: 'desc' },
      select: { ordem: true },
    });

    const novaOrdem = maxOrdem ? maxOrdem.ordem + 1 : 0;

    // Criar atribuição
    const atribuicao = await prisma.atribuicoes.create({
      data: {
        obraId: parseInt(obraId),
        equipeId: equipeId ? parseInt(equipeId) : null,
        prestador_id: prestadorId ? parseInt(prestadorId) : null,
        tipo_atribuicao: tipoAtribuicao || 'equipe',
        titulo,
        descricao,
        status: status || 'a_fazer',
        prioridade: prioridade || 'media',
        ordem: novaOrdem,
        dataInicio: dataInicio ? new Date(dataInicio) : null,
        dataFim: dataFim ? new Date(dataFim) : null,
        dias_semana: diasSemana || [],
      },
      include: {
        obra: {
          select: { id: true, nome: true },
        },
        equipe: {
          select: { id: true, nome: true, cor: true },
        },
        prestador: {
          select: { id: true, nome: true, especialidade: true },
        },
      },
    });

    // Criar log
    await prisma.logs.create({
      data: {
        usuarioId: userId,
        atribuicaoId: atribuicao.id,
        acao: 'criou',
        entidade: 'atribuicao',
        detalhes: JSON.stringify({
          titulo: atribuicao.titulo,
          status: atribuicao.status,
          obra: obra.nome,
          responsavel: equipe ? equipe.nome : (prestador ? prestador.nome : 'N/A'),
        }),
      },
    });

    return atribuicao;
  }

  /**
   * Atualizar atribuição
   */
  async update(id, data, userId) {
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
    } = data;

    // Verificar se atribuição existe
    const atribuicaoAtual = await this.getById(id);

    const updateData = {
      ...(titulo && { titulo }),
      ...(descricao !== undefined && { descricao }),
      ...(prioridade && { prioridade }),
      ...(dataInicio !== undefined && {
        dataInicio: dataInicio ? new Date(dataInicio) : null,
      }),
      ...(dataFim !== undefined && {
        dataFim: dataFim ? new Date(dataFim) : null,
      }),
      ...(equipeId !== undefined && { equipeId: equipeId ? parseInt(equipeId) : null }),
      ...(prestadorId !== undefined && { prestador_id: prestadorId ? parseInt(prestadorId) : null }),
      ...(tipoAtribuicao && { tipo_atribuicao: tipoAtribuicao }),
      ...(diasSemana !== undefined && { dias_semana: diasSemana }),
    };

    // Se mudou o status, atualizar ordem
    if (status && status !== atribuicaoAtual.status) {
      const maxOrdem = await prisma.atribuicoes.findFirst({
        where: {
          obraId: atribuicaoAtual.obraId,
          status,
        },
        orderBy: { ordem: 'desc' },
        select: { ordem: true },
      });

      updateData.status = status;
      updateData.ordem = maxOrdem ? maxOrdem.ordem + 1 : 0;
    }

    const atribuicao = await prisma.atribuicoes.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        obra: {
          select: { id: true, nome: true },
        },
        equipe: {
          select: { id: true, nome: true, cor: true },
        },
        prestador: {
          select: { id: true, nome: true, especialidade: true },
        },
      },
    });

    // Criar log
    await prisma.logs.create({
      data: {
        usuarioId: userId,
        atribuicaoId: atribuicao.id,
        acao: 'atualizou',
        entidade: 'atribuicao',
        detalhes: JSON.stringify({
          titulo: atribuicao.titulo,
          mudancas: data,
        }),
      },
    });

    return atribuicao;
  }

  /**
   * Deletar atribuição
   */
  async delete(id, userId) {
    // Verificar se atribuição existe
    const atribuicao = await this.getById(id);

    // Criar log antes de deletar
    await prisma.logs.create({
      data: {
        usuarioId: userId,
        acao: 'deletou',
        entidade: 'atribuicao',
        detalhes: JSON.stringify({
          titulo: atribuicao.titulo,
          obra: atribuicao.obra.nome,
        }),
      },
    });

    await prisma.atribuicoes.delete({
      where: { id: parseInt(id) },
    });

    return { message: 'Atribuição deletada com sucesso' };
  }

  /**
   * Mudar status da atribuição (drag & drop)
   */
  async changeStatus(id, novoStatus, novaOrdem, userId) {
    const atribuicao = await this.getById(id);

    // Atualizar status e ordem
    const updated = await prisma.atribuicoes.update({
      where: { id: parseInt(id) },
      data: {
        status: novoStatus,
        ordem: novaOrdem !== undefined ? novaOrdem : 0,
      },
      include: {
        obra: {
          select: {
            id: true,
            nome: true,
          },
        },
        equipe: {
          select: {
            id: true,
            nome: true,
            cor: true,
          },
        },
      },
    });

    // Criar log
    await prisma.logs.create({
      data: {
        usuarioId: userId,
        atribuicaoId: updated.id,
        acao: 'moveu',
        entidade: 'atribuicao',
        detalhes: JSON.stringify({
          titulo: updated.titulo,
          de: atribuicao.status,
          para: novoStatus,
        }),
      },
    });

    return updated;
  }

  /**
   * Reordenar atribuições (drag & drop dentro da mesma coluna)
   */
  async reorder(id, novaOrdem, userId) {
    const atribuicao = await this.getById(id);

    const updated = await prisma.atribuicoes.update({
      where: { id: parseInt(id) },
      data: { ordem: novaOrdem },
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
            cor: true,
          },
        },
      },
    });

    // Criar log
    await prisma.logs.create({
      data: {
        usuarioId: userId,
        atribuicaoId: updated.id,
        acao: 'reordenou',
        entidade: 'atribuicao',
        detalhes: JSON.stringify({
          titulo: updated.titulo,
          ordemAnterior: atribuicao.ordem,
          novaOrdem: novaOrdem,
        }),
      },
    });

    return updated;
  }
}

module.exports = new AtribuicoesService();
