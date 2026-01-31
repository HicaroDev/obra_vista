const express = require('express');
const router = express.Router();
const prisma = require('../config/database');

// GET /api/dashboard/stats - Buscar estatísticas do dashboard
router.get('/stats', async (req, res) => {
    try {
        // Buscar estatísticas em paralelo
        const [obrasAtivas, equipes, tarefasPendentes, tarefasTotais, tarefasConcluidas] = await Promise.all([
            // Obras ativas
            prisma.obras.count({
                where: { status: 'em_andamento' }
            }),

            // Equipes
            prisma.equipes.count({
                where: { ativa: true }
            }),

            // Tarefas pendentes (a_fazer + em_progresso)
            prisma.atribuicoes.count({
                where: {
                    status: { in: ['a_fazer', 'em_progresso'] }
                }
            }),

            // Total de tarefas (para cálculo de progresso)
            prisma.atribuicoes.count(),

            // Tarefas concluídas (para cálculo de progresso)
            prisma.atribuicoes.count({
                where: { status: 'concluido' }
            })
        ]);

        const progressoGeral = tarefasTotais > 0
            ? Math.round((tarefasConcluidas / tarefasTotais) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                obrasAtivas,
                equipes,
                tarefasPendentes,
                progressoGeral
            }
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar estatísticas',
            message: error.message
        });
    }
});

// GET /api/dashboard/atividades - Buscar atividades recentes
router.get('/atividades', async (req, res) => {
    try {
        const atividades = await prisma.atribuicoes.findMany({
            take: 10,
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                titulo: true,
                status: true,
                updatedAt: true,
                obra: {
                    select: {
                        nome: true
                    }
                }
            }
        });

        // Formatar resposta para frontend (flat structure)
        const formattedAtividades = atividades.map(a => ({
            id: a.id,
            titulo: a.titulo,
            status: a.status,
            updatedAt: a.updatedAt,
            obraNome: a.obra ? a.obra.nome : 'Sem obra'
        }));

        res.json({
            success: true,
            data: formattedAtividades
        });
    } catch (error) {
        console.error('Erro ao buscar atividades:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar atividades',
            message: error.message
        });
    }
});

module.exports = router;
