const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const produtosController = {
    // Criar novo produto
    create: async (req, res, next) => {
        try {
            const { nome, unidade } = req.body;

            // Verificar duplicidade
            const existing = await prisma.produtos.findUnique({
                where: { nome },
            });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    error: 'Produto já cadastrado com este nome',
                });
            }

            const produto = await prisma.produtos.create({
                data: {
                    nome,
                    unidade,
                },
            });

            return res.status(201).json({
                success: true,
                data: produto,
            });
        } catch (error) {
            next(error);
        }
    },

    // Listar todos os produtos
    getAll: async (req, res, next) => {
        try {
            const produtos = await prisma.produtos.findMany({
                orderBy: { nome: 'asc' },
            });

            return res.json({
                success: true,
                data: produtos,
            });
        } catch (error) {
            next(error);
        }
    },

    // Buscar produtos por termo (autocomplete)
    search: async (req, res, next) => {
        try {
            const { q } = req.query;

            if (!q) {
                return res.json({ success: true, data: [] });
            }

            const produtos = await prisma.produtos.findMany({
                where: {
                    nome: {
                        contains: q,
                        mode: 'insensitive',
                    },
                },
                orderBy: { nome: 'asc' },
                take: 10,
            });

            return res.json({
                success: true,
                data: produtos,
            });
        } catch (error) {
            next(error);
        }
    },

    // Atualizar produto
    update: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { nome, unidade } = req.body;

            const produto = await prisma.produtos.update({
                where: { id: parseInt(id) },
                data: {
                    nome,
                    unidade,
                },
            });

            return res.json({
                success: true,
                data: produto,
            });
        } catch (error) {
            next(error);
        }
    },

    // Excluir produto
    delete: async (req, res, next) => {
        try {
            const { id } = req.params;

            await prisma.produtos.delete({
                where: { id: parseInt(id) },
            });

            return res.json({
                success: true,
                message: 'Produto excluído com sucesso',
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = produtosController;
