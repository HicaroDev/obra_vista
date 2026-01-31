const prisma = require('../config/database');

class EtiquetasService {
    /**
     * Listar todas as etiquetas
     */
    async getAll() {
        return prisma.etiquetas.findMany({
            orderBy: { nome: 'asc' },
        });
    }

    /**
     * Criar nova etiqueta
     */
    async create(data) {
        // Verificar se já existe
        const existe = await prisma.etiquetas.findUnique({
            where: { nome: data.nome },
        });

        if (existe) {
            throw new Error('Etiqueta já existe');
        }

        return prisma.etiquetas.create({
            data: {
                nome: data.nome,
                cor: data.cor || '#3B82F6',
            },
        });
    }

    /**
     * Deletar etiqueta
     */
    async delete(id) {
        return prisma.etiquetas.delete({
            where: { id: parseInt(id) },
        });
    }

    /**
     * Listar etiquetas de uma tarefa
     */
    async getByTarefa(atribuicaoId) {
        const tarefaEtiquetas = await prisma.tarefa_etiquetas.findMany({
            where: { atribuicao_id: parseInt(atribuicaoId) },
            include: {
                etiquetas: true,
            },
        });

        return tarefaEtiquetas.map((te) => te.etiquetas);
    }

    /**
     * Adicionar etiqueta à tarefa
     */
    async addToTarefa(atribuicaoId, etiquetaId) {
        // Verificar se já está vinculada
        const existe = await prisma.tarefa_etiquetas.findUnique({
            where: {
                atribuicao_id_etiqueta_id: {
                    atribuicao_id: parseInt(atribuicaoId),
                    etiqueta_id: parseInt(etiquetaId),
                },
            },
        });

        if (existe) {
            return existe; // Já existe, retorna o vínculo atual
        }

        return prisma.tarefa_etiquetas.create({
            data: {
                atribuicao_id: parseInt(atribuicaoId),
                etiqueta_id: parseInt(etiquetaId),
            },
            include: {
                etiquetas: true,
            },
        });
    }

    /**
     * Remover etiqueta da tarefa
     */
    async removeFromTarefa(atribuicaoId, etiquetaId) {
        return prisma.tarefa_etiquetas.delete({
            where: {
                atribuicao_id_etiqueta_id: {
                    atribuicao_id: parseInt(atribuicaoId),
                    etiqueta_id: parseInt(etiquetaId),
                },
            },
        });
    }
}

module.exports = new EtiquetasService();
