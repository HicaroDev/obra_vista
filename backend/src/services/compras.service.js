const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ComprasService {
    async listByTarefa(atribuicaoId) {
        return await prisma.tarefa_compras.findMany({
            where: {
                atribuicao_id: parseInt(atribuicaoId),
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }

    async create(data) {
        const { atribuicaoId, material, quantidade, unidade, observacoes } = data;

        return await prisma.tarefa_compras.create({
            data: {
                atribuicao_id: parseInt(atribuicaoId),
                material,
                quantidade,
                unidade,
                observacoes,
                status: 'pendente',
            },
        });
    }

    async update(id, data) {
        const { material, quantidade, unidade, observacoes, status } = data;

        return await prisma.tarefa_compras.update({
            where: { id: parseInt(id) },
            data: {
                material,
                quantidade,
                unidade,
                observacoes,
                status,
                updated_at: new Date(),
            },
        });
    }

    async delete(id) {
        return await prisma.tarefa_compras.delete({
            where: { id: parseInt(id) },
        });
    }

    async updateStatus(id, status) {
        return await prisma.tarefa_compras.update({
            where: { id: parseInt(id) },
            data: {
                status,
                updated_at: new Date(),
            },
        });
    }
}

module.exports = new ComprasService();
