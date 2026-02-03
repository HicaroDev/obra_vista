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

// GET /api/prestadores - Listar todos os prestadores
router.get('/', async (req, res) => {
    const client = getDbClient();
    try {
        await client.connect();
        const result = await client.query(`
            SELECT 
                id, nome, especialidade, telefone, email, 
                tipo_pessoa as "tipoPessoa",
                cpf, cnpj,
                ativo,
                "createdAt",
                "updatedAt",
                pix_tipo as "pixTipo",
                pix_chave as "pixChave",
                tipo_contrato as "tipoContrato",
                valor_diaria::numeric as "valorDiaria",
                valor_vale_refeicao::numeric as "valorValeRefeicao",
                valor_vale_transporte::numeric as "valorValeTransporte",
                salario::numeric,
                bonificacao::numeric
            FROM prestadores 
            ORDER BY nome ASC
        `);
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Erro ao buscar prestadores:', error);
        console.error('Detalhes:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar prestadores',
            message: error.message
        });
    } finally {
        await client.end();
    }
});

// GET /api/prestadores/:id - Buscar prestador por ID
router.get('/:id', async (req, res) => {
    const client = getDbClient();
    try {
        await client.connect();
        const result = await client.query(`
            SELECT 
                id, nome, especialidade, telefone, email,
                tipo_pessoa as "tipoPessoa",
                cpf, cnpj,
                ativo,
                "createdAt",
                "updatedAt",
                pix_tipo as "pixTipo",
                pix_chave as "pixChave",
                tipo_contrato as "tipoContrato",
                valor_diaria::numeric as "valorDiaria",
                valor_vale_refeicao::numeric as "valorValeRefeicao",
                valor_vale_transporte::numeric as "valorValeTransporte",
                salario::numeric,
                bonificacao::numeric
            FROM prestadores 
            WHERE id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prestador não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar prestador:', error);
        res.status(500).json({ error: 'Erro ao buscar prestador' });
    } finally {
        await client.end();
    }
});

// POST /api/prestadores - Criar novo prestador
router.post('/', async (req, res) => {
    const client = getDbClient();
    try {
        const {
            nome, especialidade, telefone, email, tipoPessoa = 'PF', cpf, cnpj, ativo = true,
            pixTipo, pixChave, tipoContrato, valorDiaria, valorValeRefeicao, valorValeTransporte, salario, bonificacao
        } = req.body;

        if (!nome || !especialidade) {
            return res.status(400).json({
                success: false,
                error: 'Nome e especialidade são obrigatórios'
            });
        }

        // Validar CPF ou CNPJ conforme tipo
        if (tipoPessoa === 'PF' && !cpf) {
            return res.status(400).json({
                success: false,
                error: 'CPF é obrigatório para Pessoa Física'
            });
        }

        if (tipoPessoa === 'PJ' && !cnpj) {
            return res.status(400).json({
                success: false,
                error: 'CNPJ é obrigatório para Pessoa Jurídica'
            });
        }

        await client.connect();
        const result = await client.query(`
            INSERT INTO prestadores (
                nome, especialidade, telefone, email, tipo_pessoa, cpf, cnpj, ativo,
                pix_tipo, pix_chave, tipo_contrato, valor_diaria, valor_vale_refeicao, valor_vale_transporte, salario, bonificacao
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING 
                id, nome, especialidade, telefone, email,
                tipo_pessoa as "tipoPessoa",
                cpf, cnpj,
                ativo,
                "createdAt",
                "updatedAt",
                pix_tipo as "pixTipo",
                pix_chave as "pixChave",
                tipo_contrato as "tipoContrato",
                valor_diaria::numeric as "valorDiaria",
                valor_vale_refeicao::numeric as "valorValeRefeicao",
                valor_vale_transporte::numeric as "valorValeTransporte",
                salario::numeric,
                bonificacao::numeric
        `, [
            nome, especialidade, telefone, email, tipoPessoa, cpf, cnpj, ativo,
            pixTipo, pixChave, tipoContrato, valorDiaria, valorValeRefeicao, valorValeTransporte, salario, bonificacao
        ]);

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao criar prestador:', error);
        console.error('Detalhes:', error.message);
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({
                success: false,
                error: 'CPF ou CNPJ já cadastrado'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Erro ao criar prestador',
            message: error.message
        });
    } finally {
        await client.end();
    }
});

// PUT /api/prestadores/:id - Atualizar prestador
router.put('/:id', async (req, res) => {
    const client = getDbClient();
    try {
        const {
            nome, especialidade, telefone, email, tipoPessoa, cpf, cnpj, ativo,
            pixTipo, pixChave, tipoContrato, valorDiaria, valorValeRefeicao, valorValeTransporte, salario, bonificacao
        } = req.body;

        await client.connect();
        const result = await client.query(`
            UPDATE prestadores 
            SET 
                nome = COALESCE($1, nome),
                especialidade = COALESCE($2, especialidade),
                telefone = COALESCE($3, telefone),
                email = COALESCE($4, email),
                tipo_pessoa = COALESCE($5, tipo_pessoa),
                cpf = COALESCE($6, cpf),
                cnpj = COALESCE($7, cnpj),
                ativo = COALESCE($8, ativo),
                pix_tipo = COALESCE($9, pix_tipo),
                pix_chave = COALESCE($10, pix_chave),
                tipo_contrato = COALESCE($11, tipo_contrato),
                valor_diaria = COALESCE($12, valor_diaria),
                valor_vale_refeicao = COALESCE($13, valor_vale_refeicao),
                valor_vale_transporte = COALESCE($14, valor_vale_transporte),
                salario = COALESCE($15, salario),
                bonificacao = COALESCE($16, bonificacao),
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE id = $17
            RETURNING 
                id, nome, especialidade, telefone, email,
                tipo_pessoa as "tipoPessoa",
                cpf, cnpj,
                ativo,
                "createdAt",
                "updatedAt",
                pix_tipo as "pixTipo",
                pix_chave as "pixChave",
                tipo_contrato as "tipoContrato",
                valor_diaria::numeric as "valorDiaria",
                valor_vale_refeicao::numeric as "valorValeRefeicao",
                valor_vale_transporte::numeric as "valorValeTransporte",
                salario::numeric,
                bonificacao::numeric
        `, [
            nome, especialidade, telefone, email, tipoPessoa, cpf, cnpj, ativo,
            pixTipo, pixChave, tipoContrato, valorDiaria, valorValeRefeicao, valorValeTransporte, salario, bonificacao,
            req.params.id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prestador não encontrado' });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao atualizar prestador:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'CPF ou CNPJ já cadastrado' });
        }
        res.status(500).json({ error: 'Erro ao atualizar prestador' });
    } finally {
        await client.end();
    }
});

// DELETE /api/prestadores/:id - Excluir prestador
router.delete('/:id', async (req, res) => {
    const client = getDbClient();
    try {
        await client.connect();
        const result = await client.query('DELETE FROM prestadores WHERE id = $1 RETURNING id', [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prestador não encontrado' });
        }

        res.json({
            success: true,
            message: 'Prestador excluído com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir prestador:', error);
        res.status(500).json({ error: 'Erro ao excluir prestador' });
    } finally {
        await client.end();
    }
});

module.exports = router;
