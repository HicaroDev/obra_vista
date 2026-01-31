const prisma = require('../config/database');

class EquipesService {
  /**
   * Listar todas as equipes
   */
  async getAll(filters = {}) {
    const { ativa, search } = filters;

    const where = {};

    if (ativa !== undefined) {
      where.ativa = ativa === 'true' || ativa === true;
    }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    const equipes = await prisma.equipes.findMany({
      where,
      include: {
        membros: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
                tipo: true,
              },
            },
            prestador: {
              select: {
                id: true,
                nome: true,
                especialidade: true,
                telefone: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            membros: true,
            atribuicoes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return equipes;
  }

  /**
   * Buscar equipe por ID
   */
  async getById(id) {
    const equipe = await prisma.equipes.findUnique({
      where: { id: parseInt(id) },
      include: {
        membros: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
                tipo: true,
              },
            },
            prestador: {
              select: {
                id: true,
                nome: true,
                especialidade: true,
                telefone: true,
                email: true,
              },
            },
          },
        },
        atribuicoes: {
          include: {
            obra: {
              select: {
                id: true,
                nome: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            membros: true,
            atribuicoes: true,
          },
        },
      },
    });

    if (!equipe) {
      throw new Error('Equipe não encontrada');
    }

    return equipe;
  }

  /**
   * Criar nova equipe
   */
  async create(data) {
    const { nome, descricao, cor, membros } = data;

    // Criar equipe com membros
    const equipe = await prisma.equipes.create({
      data: {
        nome,
        descricao,
        cor: cor || '#3B82F6',
        ativa: true,
        membros: membros
          ? {
              create: membros.map((membro) => ({
                usuarioId: membro.usuarioId || null,
                prestadorId: membro.prestadorId || null,
                papel: membro.papel || 'membro',
              })),
            }
          : undefined,
      },
      include: {
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
    });

    return equipe;
  }

  /**
   * Atualizar equipe
   */
  async update(id, data) {
    const { nome, descricao, cor, ativa } = data;

    // Verificar se equipe existe
    await this.getById(id);

    const equipe = await prisma.equipes.update({
      where: { id: parseInt(id) },
      data: {
        ...(nome && { nome }),
        ...(descricao !== undefined && { descricao }),
        ...(cor && { cor }),
        ...(ativa !== undefined && { ativa }),
      },
      include: {
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
    });

    return equipe;
  }

  /**
   * Deletar equipe
   */
  async delete(id) {
    // Verificar se equipe existe
    await this.getById(id);

    // Verificar se tem atribuições ativas
    const atribuicoesAtivas = await prisma.atribuicoes.count({
      where: {
        equipeId: parseInt(id),
        status: { in: ['a_fazer', 'em_progresso'] },
      },
    });

    if (atribuicoesAtivas > 0) {
      throw new Error(
        'Não é possível deletar equipe com atribuições ativas. Conclua ou reatribua as tarefas primeiro.'
      );
    }

    await prisma.equipes.delete({
      where: { id: parseInt(id) },
    });

    return { message: 'Equipe deletada com sucesso' };
  }

  /**
   * Adicionar membro à equipe
   */
  async addMembro(equipeId, membroData) {
    const { usuarioId, prestadorId, papel } = membroData;

    // Verificar se equipe existe
    await this.getById(equipeId);

    // Verificar se já é membro
    const existingMembro = await prisma.equipes_Membros.findFirst({
      where: {
        equipeId: parseInt(equipeId),
        ...(usuarioId && { usuarioId: parseInt(usuarioId) }),
        ...(prestadorId && { prestadorId: parseInt(prestadorId) }),
      },
    });

    if (existingMembro) {
      throw new Error('Este membro já faz parte da equipe');
    }

    const membro = await prisma.equipes_Membros.create({
      data: {
        equipeId: parseInt(equipeId),
        usuarioId: usuarioId ? parseInt(usuarioId) : null,
        prestadorId: prestadorId ? parseInt(prestadorId) : null,
        papel: papel || 'membro',
      },
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
    });

    return membro;
  }

  /**
   * Remover membro da equipe
   */
  async removeMembro(equipeId, membroId) {
    // Verificar se equipe existe
    await this.getById(equipeId);

    const membro = await prisma.equipes_Membros.findUnique({
      where: { id: parseInt(membroId) },
    });

    if (!membro || membro.equipeId !== parseInt(equipeId)) {
      throw new Error('Membro não encontrado nesta equipe');
    }

    await prisma.equipes_Membros.delete({
      where: { id: parseInt(membroId) },
    });

    return { message: 'Membro removido da equipe com sucesso' };
  }

  /**
   * Atualizar papel do membro
   */
  async updateMembroPapel(equipeId, membroId, papel) {
    // Verificar se equipe existe
    await this.getById(equipeId);

    const membro = await prisma.equipes_Membros.findUnique({
      where: { id: parseInt(membroId) },
    });

    if (!membro || membro.equipeId !== parseInt(equipeId)) {
      throw new Error('Membro não encontrado nesta equipe');
    }

    const updatedMembro = await prisma.equipes_Membros.update({
      where: { id: parseInt(membroId) },
      data: { papel },
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
    });

    return updatedMembro;
  }
}

module.exports = new EquipesService();
