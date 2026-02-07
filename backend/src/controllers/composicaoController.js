const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
    try {
        const { busca, unidade } = req.query;

        const where = {};
        if (unidade) where.unidade = unidade;

        if (busca) {
            where.OR = [
                { descricao: { contains: busca, mode: 'insensitive' } },
                { codigo: { contains: busca, mode: 'insensitive' } },
            ];
        }

        const composicoes = await prisma.composicaoMaster.findMany({
            where,
            orderBy: { descricao: 'asc' },
            include: {
                itens: {
                    include: {
                        insumo: true,
                        composicaoFilha: true
                    }
                }
            }
        });

        res.json(composicoes);
    } catch (error) {
        console.error('Erro ao buscar composições:', error);
        res.status(500).json({ error: 'Erro ao buscar composições' });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const composicao = await prisma.composicaoMaster.findUnique({
            where: { id: parseInt(id) },
            include: {
                itens: {
                    include: {
                        insumo: true,
                        composicaoFilha: true
                    }
                },
                usadaEm: true // Ver onde esta composição é usada
            }
        });

        if (!composicao) {
            return res.status(404).json({ error: 'Composição não encontrada' });
        }

        res.json(composicao);
    } catch (error) {
        console.error('Erro ao buscar composição:', error);
        res.status(500).json({ error: 'Erro ao buscar composição' });
    }
};

exports.create = async (req, res) => {
    try {
        const { codigo, descricao, unidade, tipo, itens } = req.body;
        // itens deve ser um array de { insumoId, filhaId, coeficiente }

        const composicao = await prisma.composicaoMaster.create({
            data: {
                codigo,
                descricao,
                unidade,
                tipo: tipo || 'proprio',
                itens: {
                    create: itens?.map(item => ({
                        insumoId: item.insumoId,
                        filhaId: item.filhaId,
                        coeficiente: item.coeficiente
                    }))
                }
            },
            include: {
                itens: true
            }
        });

        res.status(201).json(composicao);
    } catch (error) {
        console.error('Erro ao criar composição:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Código de composição já existe' });
        }
        res.status(500).json({ error: 'Erro ao criar composição' });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { codigo, descricao, unidade, tipo, itens } = req.body;

        // Transaction para atualizar dados e itens
        const composicao = await prisma.$transaction(async (prisma) => {
            // 1. Atualizar dados básicos
            const updated = await prisma.composicaoMaster.update({
                where: { id: parseInt(id) },
                data: {
                    codigo,
                    descricao,
                    unidade,
                    tipo
                }
            });

            // 2. Se vier itens, atualizar (estratégia simples: delete all + create all)
            // Para um sistema real robusto, seria melhor diff (update/delete/create)
            if (itens) {
                await prisma.composicaoItemMaster.deleteMany({
                    where: { composicaoId: parseInt(id) }
                });

                await prisma.composicaoItemMaster.createMany({
                    data: itens.map(item => ({
                        composicaoId: parseInt(id),
                        insumoId: item.insumoId,
                        filhaId: item.filhaId,
                        coeficiente: item.coeficiente
                    }))
                });
            }

            return updated;
        });

        // Buscar versão atualizada com itens
        const finalResult = await prisma.composicaoMaster.findUnique({
            where: { id: parseInt(id) },
            include: { itens: true }
        });

        res.json(finalResult);

    } catch (error) {
        console.error('Erro ao atualizar composição:', error);
        res.status(500).json({ error: 'Erro ao atualizar composição' });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.composicaoMaster.delete({
            where: { id: parseInt(id) },
        });

        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar composição:', error);
        res.status(500).json({ error: 'Erro ao deletar composição' });
    }
};
