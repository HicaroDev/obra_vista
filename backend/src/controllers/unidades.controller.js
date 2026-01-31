const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const unidadesController = {
    // Criar nova unidade
    create: async (req, res, next) => {
        try {
            const { nome, sigla } = req.body;

            // Verificar duplicidade
            const existing = await prisma.unidades.findFirst({
                where: {
                    OR: [
                        { nome },
                        { sigla }
                    ]
                },
            });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    error: 'Unidade já cadastrada com este nome ou sigla',
                });
            }

            const unidade = await prisma.unidades.create({
                data: {
                    nome,
                    sigla,
                },
            });

            return res.status(201).json({
                success: true,
                data: unidade,
            });
        } catch (error) {
            next(error);
        }
    },

    // Listar todas as unidades
    getAll: async (req, res, next) => {
        try {
            const unidades = await prisma.unidades.findMany({
                orderBy: { nome: 'asc' },
            });

            return res.json({
                success: true,
                data: unidades,
            });
        } catch (error) {
            next(error);
        }
    },

    // Atualizar unidade
    update: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { nome, sigla } = req.body;

            const unidade = await prisma.unidades.update({
                where: { id: parseInt(id) },
                data: {
                    nome,
                    sigla,
                },
            });

            return res.json({
                success: true,
                data: unidade,
            });
        } catch (error) {
            next(error);
        }
    },

    // Excluir unidade
    delete: async (req, res, next) => {
        try {
            const { id } = req.params;

            await prisma.unidades.delete({
                where: { id: parseInt(id) },
            });

            return res.json({
                success: true,
                message: 'Unidade excluída com sucesso',
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = unidadesController;
