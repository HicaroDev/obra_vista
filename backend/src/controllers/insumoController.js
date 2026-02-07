const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
    try {
        const { tipo, busca, origem } = req.query;

        const where = {};
        if (tipo) where.tipo = tipo;
        if (origem) where.origem = origem;

        if (busca) {
            where.OR = [
                { descricao: { contains: busca, mode: 'insensitive' } },
                { codigo: { contains: busca, mode: 'insensitive' } },
            ];
        }

        const insumos = await prisma.insumoMaster.findMany({
            where,
            orderBy: { descricao: 'asc' },
        });

        res.json(insumos);
    } catch (error) {
        console.error('Erro ao buscar insumos:', error);
        res.status(500).json({ error: 'Erro ao buscar insumos' });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await prisma.insumoMaster.findUnique({
            where: { id: parseInt(id) },
        });

        if (!insumo) {
            return res.status(404).json({ error: 'Insumo não encontrado' });
        }

        res.json(insumo);
    } catch (error) {
        console.error('Erro ao buscar insumo:', error);
        res.status(500).json({ error: 'Erro ao buscar insumo' });
    }
};

exports.create = async (req, res) => {
    try {
        const { codigo, descricao, unidade, tipo, custoPadrao, origem } = req.body;

        const insumo = await prisma.insumoMaster.create({
            data: {
                codigo,
                descricao,
                unidade,
                tipo: tipo || 'material',
                custoPadrao: custoPadrao || 0,
                origem: origem || 'proprio',
            },
        });

        res.status(201).json(insumo);
    } catch (error) {
        console.error('Erro ao criar insumo:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Código de insumo já existe' });
        }
        res.status(500).json({ error: 'Erro ao criar insumo' });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { codigo, descricao, unidade, tipo, custoPadrao, origem } = req.body;

        const insumo = await prisma.insumoMaster.update({
            where: { id: parseInt(id) },
            data: {
                codigo,
                descricao,
                unidade,
                tipo,
                custoPadrao,
                origem,
            },
        });

        res.json(insumo);
    } catch (error) {
        console.error('Erro ao atualizar insumo:', error);
        res.status(500).json({ error: 'Erro ao atualizar insumo' });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.insumoMaster.delete({
            where: { id: parseInt(id) },
        });

        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar insumo:', error);
        res.status(500).json({ error: 'Erro ao deletar insumo' });
    }
};
