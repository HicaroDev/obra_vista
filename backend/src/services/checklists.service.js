const prisma = require('../config/database');

class ChecklistsService {
    async getByAtribuicao(atribuicaoId) {
        return prisma.tarefa_checklists.findMany({
            where: { atribuicao_id: parseInt(atribuicaoId) },
            orderBy: { ordem: 'asc' },
        });
    }

    async create(atribuicaoId, data) {
        return prisma.tarefa_checklists.create({
            data: {
                atribuicao_id: parseInt(atribuicaoId),
                titulo: data.titulo,
                concluido: data.concluido || false,
                ordem: data.ordem || 0,
            },
        });
    }

    async update(id, data) {
        return prisma.tarefa_checklists.update({
            where: { id: parseInt(id) },
            data: {
                titulo: data.titulo,
                concluido: data.concluido,
                ordem: data.ordem,
            },
        });
    }

    async delete(id) {
        return prisma.tarefa_checklists.delete({
            where: { id: parseInt(id) },
        });
    }
}

module.exports = new ChecklistsService();
