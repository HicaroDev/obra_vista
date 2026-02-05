const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Listar ferramentas
router.get('/', async (req, res) => {
    try {
        const query = req.query.q || '';
        const ferramentas = await prisma.ferramentas.findMany({
            where: {
                OR: [
                    { nome: { contains: query, mode: 'insensitive' } },
                    { codigo: { contains: query, mode: 'insensitive' } }
                ]
            },
            include: {
                movimentacoes: {
                    where: { dataDevolucao: null },
                    include: {
                        obra: true,
                        responsavel: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { nome: 'asc' }
        });

        // Formatar para o frontend
        const data = ferramentas.map(f => ({
            ...f,
            localizacao_atual: f.movimentacoes[0] ? {
                obra: f.movimentacoes[0].obra,
                responsavel: f.movimentacoes[0].responsavel,
                dataSaida: f.movimentacoes[0].dataSaida
            } : null
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Erro ao listar ferramentas:', error);
        res.status(500).json({ success: false, error: 'Erro ao listar ferramentas' });
    }
});

// Criar ferramenta
router.post('/', async (req, res) => {
    try {
        const { nome, marca, codigo, status } = req.body;

        if (!nome) {
            return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
        }

        const ferramenta = await prisma.ferramentas.create({
            data: {
                nome,
                marca,
                codigo,
                status: status || 'disponivel'
            }
        });

        res.status(201).json({ success: true, data: ferramenta });
    } catch (error) {
        console.error('Erro ao criar ferramenta:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar ferramenta' });
    }
});

// Atualizar ferramenta
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, marca, codigo, status } = req.body;

        const ferramenta = await prisma.ferramentas.update({
            where: { id: Number(id) },
            data: { nome, marca, codigo, status }
        });

        res.json({ success: true, data: ferramenta });
    } catch (error) {
        console.error('Erro ao atualizar ferramenta:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar ferramenta' });
    }
});

// Excluir ferramenta
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.ferramentas.delete({
            where: { id: Number(id) }
        });
        res.json({ success: true, message: 'Ferramenta excluída' });
    } catch (error) {
        console.error('Erro ao excluir ferramenta:', error);
        res.status(500).json({ success: false, error: 'Erro ao excluir ferramenta' });
    }
});

// Registrar Movimentação
router.post('/movimentacao', async (req, res) => {
    try {
        const { ferramentaId, acao, obraId, responsavelId, observacao } = req.body;

        if (!ferramentaId || !acao) {
            return res.status(400).json({ success: false, error: 'Dados incompletos' });
        }

        if (acao === 'saida' || acao === 'transferencia') {
            // Verifica status atual
            const f = await prisma.ferramentas.findUnique({ where: { id: Number(ferramentaId) } });

            const operacoes = [];

            // Se já estiver em uso, é uma TRANSFERÊNCIA: fecha a anterior primeiro
            if (f.status === 'em_uso') {
                const anterior = await prisma.movimentacaoFerramentas.findFirst({
                    where: { ferramentaId: Number(ferramentaId), dataDevolucao: null }
                });

                if (anterior) {
                    operacoes.push(
                        prisma.movimentacaoFerramentas.update({
                            where: { id: anterior.id },
                            data: {
                                dataDevolucao: new Date(),
                                status: 'transferida', // Novo status para indicar que não voltou pra base
                                observacao: anterior.observacao ? `${anterior.observacao} (Transferida)` : '(Transferida)'
                            }
                        })
                    );
                }
            }

            // Cria a nova movimentação (Saída ou Entrada na nova Obra)
            operacoes.push(
                prisma.movimentacaoFerramentas.create({
                    data: {
                        ferramentaId: Number(ferramentaId),
                        obraId: obraId ? Number(obraId) : null,
                        responsavelId: responsavelId ? Number(responsavelId) : null,
                        status: 'em_uso',
                        observacao: acao === 'transferencia' ? `Transferência: ${observacao || ''}` : observacao
                    }
                })
            );

            // Garante que o status da ferramenta esteja 'em_uso'
            operacoes.push(
                prisma.ferramentas.update({
                    where: { id: Number(ferramentaId) },
                    data: { status: 'em_uso' }
                })
            );

            await prisma.$transaction(operacoes);

        } else if (acao === 'devolucao') {
            // Busca movimento aberto
            const aberto = await prisma.movimentacaoFerramentas.findFirst({
                where: { ferramentaId: Number(ferramentaId), dataDevolucao: null }
            });

            const operacoes = [
                prisma.ferramentas.update({
                    where: { id: Number(ferramentaId) },
                    data: { status: 'disponivel' }
                })
            ];

            if (aberto) {
                operacoes.push(
                    prisma.movimentacaoFerramentas.update({
                        where: { id: aberto.id },
                        data: {
                            dataDevolucao: new Date(),
                            status: 'devolvida'
                        }
                    })
                );
            }

            await prisma.$transaction(operacoes);
        }

        res.json({ success: true, message: 'Movimentação registrada com sucesso' });
    } catch (error) {
        console.error('Erro na movimentação:', error);
        res.status(500).json({ success: false, error: 'Erro ao registrar movimentação' });
    }
});

// Histórico
router.get('/:id/historico', async (req, res) => {
    try {
        const { id } = req.params;
        const historico = await prisma.movimentacaoFerramentas.findMany({
            where: { ferramentaId: Number(id) },
            include: {
                obra: true,
                responsavel: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const data = historico.map(h => ({
            ...h,
            obraNome: h.obra?.nome,
            responsavelNome: h.responsavel?.nome
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar histórico' });
    }
});

// Dashboard Stats
router.get('/dashboard/stats', async (req, res) => {
    try {
        const [total, disponiveis, em_uso, manutencao] = await Promise.all([
            prisma.ferramentas.count(),
            prisma.ferramentas.count({ where: { status: 'disponivel' } }),
            prisma.ferramentas.count({ where: { status: 'em_uso' } }),
            prisma.ferramentas.count({ where: { status: 'manutencao' } })
        ]);

        res.json({ success: true, data: { total, disponiveis, em_uso, manutencao } });
    } catch (error) {
        console.error('Erro nos stats:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar estatísticas' });
    }
});

module.exports = router;
