const prisma = require('../config/database');
const fs = require('fs');
const path = require('path');
const uploadConfig = require('../config/upload');

class AnexosService {
    /**
     * Listar anexos de uma atribuição
     */
    async getByAtribuicao(atribuicaoId) {
        const anexos = await prisma.tarefa_anexos.findMany({
            where: { atribuicao_id: parseInt(atribuicaoId) },
            orderBy: { created_at: 'desc' },
        });

        return anexos;
    }

    /**
     * Salvar anexo no banco de dados e retornar dados
     */
    async create(atribuicaoId, file) {
        // Determinar tipo de arquivo
        let tipo = 'documento';
        if (file.mimetype.startsWith('image/')) {
            tipo = 'foto';
        } else if (file.mimetype.startsWith('video/')) {
            tipo = 'video';
        }

        // URL para acesso público (servida estaticamente)
        // Assumindo que o servidor serve a pasta uploads em /uploads
        const url = `/uploads/${file.filename}`;

        const anexo = await prisma.tarefa_anexos.create({
            data: {
                atribuicao_id: parseInt(atribuicaoId),
                nome_arquivo: file.originalname,
                tipo,
                url,
                tamanho: file.size,
            },
        });

        return anexo;
    }

    /**
     * Deletar anexo
     */
    async delete(id) {
        // Buscar anexo para pegar o nome do arquivo
        const anexo = await prisma.tarefa_anexos.findUnique({
            where: { id: parseInt(id) },
        });

        if (!anexo) {
            throw new Error('Anexo não encontrado');
        }

        // Remover arquivo do disco
        const filename = path.basename(anexo.url);
        const filePath = path.join(uploadConfig.directory, filename);

        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Erro ao deletar arquivo físico:', error);
            // Continua para remover do banco mesmo se falhar no disco
        }

        // Remover do banco
        await prisma.tarefa_anexos.delete({
            where: { id: parseInt(id) },
        });

        return { message: 'Anexo deletado com sucesso' };
    }
}

module.exports = new AnexosService();
