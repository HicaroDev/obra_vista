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
                "updatedAt"
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
                "updatedAt"
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
        const { nome, especialidade, telefone, email, tipoPessoa = 'PF', cpf, cnpj, ativo = true } = req.body;

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
            INSERT INTO prestadores (nome, especialidade, telefone, email, tipo_pessoa, cpf, cnpj, ativo)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING 
                id, nome, especialidade, telefone, email,
                tipo_pessoa as "tipoPessoa",
                cpf, cnpj,
                ativo,
                "createdAt",
                "updatedAt"
        `, [nome, especialidade, telefone, email, tipoPessoa, cpf, cnpj, ativo]);

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
        const { nome, especialidade, telefone, email, tipoPessoa, cpf, cnpj, ativo } = req.body;

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
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING 
                id, nome, especialidade, telefone, email,
                tipo_pessoa as "tipoPessoa",
                cpf, cnpj,
                ativo,
                "createdAt",
                "updatedAt"
        `, [nome, especialidade, telefone, email, tipoPessoa, cpf, cnpj, ativo, req.params.id]);

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
