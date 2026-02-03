const express = require('express');
const router = express.Router();
const { Client } = require('pg');

// Configuração do banco de dados
const getDbClient = () => {
    return new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
};

/**
 * GET /api/frequencia
 * Retorna a lista de frequência para uma data específica.
 * Query Params: data (YYYY-MM-DD)
 */
router.get('/', async (req, res) => {
    const client = getDbClient();
    try {
        const { data } = req.query;
        if (!data) {
            return res.status(400).json({ error: 'Data é obrigatória (YYYY-MM-DD)' });
        }

        await client.connect();

        // Busca todos os prestadores ativos
        // E faz um LEFT JOIN com a tabela de frequencia para ver se já tem registro naquele dia
        const query = `
            SELECT 
                p.id as "prestadorId",
                p.nome,
                p.especialidade,
                f.id as "frequenciaId",
                f.presente,
                f.observacao,
                f."obraId",
                o.nome as "nomeObra"
            FROM prestadores p
            LEFT JOIN frequencia f ON p.id = f."prestadorId" AND f.data = $1
            LEFT JOIN obras o ON f."obraId" = o.id
            WHERE p.ativo = true
            ORDER BY p.nome ASC
        `;

        const result = await client.query(query, [data]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Erro ao buscar frequência:', error);
        res.status(500).json({ error: 'Erro ao buscar frequência' });
    } finally {
        await client.end();
    }
});


/**
 * GET /api/frequencia/relatorio
 * Retorna o consolidado de presenças por período para a Folha de Ponto.
 * Query Params: inicio (YYYY-MM-DD), fim (YYYY-MM-DD)
 */
router.get('/relatorio', async (req, res) => {
    const client = getDbClient();
    try {
        const { inicio, fim } = req.query;
        if (!inicio || !fim) {
            return res.status(400).json({ error: 'Data de início e fim são obrigatórias' });
        }

        await client.connect();

        const query = `
        SELECT
        p.id,
            p.nome,
            p.especialidade as "funcao",
            p.valor_diaria:: numeric as "valorDiaria",
                p.pix_tipo as "pixTipo",
                p.pix_chave as "pixChave",
                p.tipo_contrato as "tipoContrato",
                p.salario:: numeric,
                    p.dia_pagamento as "diaPagamento",
                    p.dia_vale as "diaVale",
                    p.valor_adiantamento:: numeric as "valorAdiantamento",
                        COUNT(f.id):: int as "diasTrabalhados",
                            (
                                SELECT COALESCE(SUM(d.valor), 0) 
                    FROM descontos d 
                    WHERE d."prestadorId" = p.id AND d.data >= $1 AND d.data <= $2
                ):: numeric as "totalDescontos"
            FROM prestadores p
            LEFT JOIN frequencia f ON p.id = f."prestadorId" AND f.data >= $1 AND f.data <= $2 AND f.presente = true
WHERE(
    (p.tipo_contrato = 'clt' AND p.ativo = true) OR
        (f.id IS NOT NULL)
            )
            GROUP BY p.id
            ORDER BY p.nome ASC
    `;

        const result = await client.query(query, [inicio, fim]);

        const start = new Date(inicio);
        const end = new Date(fim);
        // Ajusta para ignorar hora e focar só na data UTC/Local
        const startDay = start.getDate();
        const endDay = end.getDate();
        const startMonth = start.getMonth();
        const endMonth = end.getMonth();

        const data = result.rows.map(row => {
            let totalPagar = 0;
            const descontos = Number(row.totalDescontos || 0);

            if (row.tipoContrato === 'clt') {
                const diaPag = row.diaPagamento || 5;
                const diaVale = row.diaVale || 20;
                const salario = Number(row.salario || 0);
                const valAdiantamento = Number(row.valorAdiantamento || 0);
                // Salário Líquido (sem impostos aqui, apenas Salario - Adiantamento se houver)
                // Se o user quiser lógica complexa de INSS/IRRF, precisaria de mais dados.
                // Assumindo simplicidade: Pagamento = Salario - Adiantamento. Vale = Adiantamento.

                // Verifica se a data de pagamento cai no período


                // Lógica simplificada de intervalo:
                // Se o diaPag está dentro do range (considerando meses também se o range for grande, mas assumindo range no mesmo mês ou virada)
                // Vamos checar data por data do intervalo

                let devePagarSalario = false;
                let devePagarVale = false;

                // Percorre cada dia do intervalo selecionado
                let current = new Date(start);
                while (current <= end) {
                    const dia = current.getDate();
                    if (dia === diaPag) devePagarSalario = true;
                    if (dia === diaVale) devePagarVale = true;
                    current.setDate(current.getDate() + 1);
                }

                if (devePagarVale) {
                    totalPagar += valAdiantamento;
                }
                if (devePagarSalario) {
                    // Se paga salario, desconta o vale se ele já foi pago NO MESMO MÊS? 
                    // Geralmente fim do mês paga (Salario - Vale).
                    // Vou assumir pagamento integral do saldo restante.
                    totalPagar += (salario - valAdiantamento);
                }
            } else {
                // Diária / Empreita
                totalPagar = Number(row.diasTrabalhados) * Number(row.valorDiaria || 0);
            }

            return {
                ...row,
                valorTotal: totalPagar - descontos,
                descontos: descontos
            };
        });

        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Erro ao gerar relatório de frequência:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório' });
    } finally {
        await client.end();
    }
});

/**
 * GET /api/frequencia/descontos
 * Lista descontos de um prestador no período
 */
router.get('/descontos', async (req, res) => {
    const client = getDbClient();
    try {
        const { prestadorId, inicio, fim } = req.query;

        if (!prestadorId) {
            return res.status(400).json({ error: 'Prestador ID é obrigatório' });
        }

        await client.connect();

        // Verifica se há filtro de data, senão pega últimos 30 dias
        let whereClause = 'WHERE "prestadorId" = $1';
        let params = [prestadorId];

        if (inicio && fim) {
            whereClause += ' AND data >= $2 AND data <= $3';
            params.push(inicio, fim);
        }

        const query = `
            SELECT id, data, valor::numeric, descricao, "createdAt"
            FROM descontos
            ${whereClause}
            ORDER BY data DESC, "createdAt" DESC
        `;

        const result = await client.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Erro ao listar descontos:', error);
        res.status(500).json({ error: 'Erro ao listar descontos' });
    } finally {
        await client.end();
    }
});

/**
 * POST /api/frequencia/desconto
 * Adiciona um desconto para um prestador
 */
router.post('/desconto', async (req, res) => {
    const client = getDbClient();
    try {
        const { prestadorId, data, valor, descricao } = req.body;

        if (!prestadorId || !data || !valor) {
            return res.status(400).json({ error: 'Prestador, data e valor são obrigatórios' });
        }

        await client.connect();
        const result = await client.query(`
            INSERT INTO descontos("prestadorId", data, valor, descricao, "updatedAt")
VALUES($1, $2, $3, $4, NOW())
            RETURNING id
    `, [prestadorId, data, valor, descricao]);

        res.json({ success: true, id: result.rows[0].id });
    } catch (error) {
        console.error('Erro ao salvar desconto:', error);
        res.status(500).json({ error: 'Erro ao salvar desconto' });
    } finally {
        await client.end();
    }
});

/**
 * POST /api/frequencia
 * Registra ou atualiza a presença de um prestador.
 */
router.post('/', async (req, res) => {
    const client = getDbClient();
    try {
        const { data, prestadorId, obraId, presente, observacao } = req.body;

        if (!data || !prestadorId) {
            return res.status(400).json({ error: 'Data e Prestador são obrigatórios' });
        }

        await client.connect();

        // Verifica se já existe registro para atualizar ou criar (UPSERT)
        // PostgreSQL suporta ON CONFLICT
        const query = `
            INSERT INTO frequencia(data, "prestadorId", "obraId", presente, observacao, "updatedAt")
VALUES($1, $2, $3, $4, $5, NOW())
            ON CONFLICT(data, "prestadorId") 
            DO UPDATE SET
"obraId" = EXCLUDED."obraId",
    presente = EXCLUDED.presente,
    observacao = EXCLUDED.observacao,
    "updatedAt" = NOW()
            RETURNING id
    `;

        const result = await client.query(query, [data, prestadorId, obraId || null, presente, observacao]);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao salvar frequência:', error);
        res.status(500).json({ error: 'Erro ao salvar frequência' });
    } finally {
        await client.end();
    }
});

module.exports = router;
