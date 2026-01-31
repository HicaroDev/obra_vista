const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
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

// GET /api/usuarios - Listar todos os usuários
router.get('/', async (req, res) => {
    const client = getDbClient();
    try {
        await client.connect();

        // Buscar usuários (sem roles, usamos apenas tipo)
        const result = await client.query(`
            SELECT 
                u.id, u.nome, u.email, u.tipo, u.telefone, u.cargo,
                u.ativo, u.permissoes_custom as "permissoesCustom",
                u."createdAt",
                u."updatedAt"
            FROM usuarios u
            ORDER BY u.nome ASC
        `);

        // Adicionar array vazio de roles para compatibilidade
        const usuarios = result.rows.map(u => ({
            ...u,
            permissoesCustom: u.permissoesCustom || {},
            roles: []
        }));

        res.json({
            success: true,
            data: usuarios
        });
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        console.error('Detalhes do erro:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar usuários',
            message: error.message
        });
    } finally {
        await client.end();
    }
});

// GET /api/usuarios/:id - Buscar usuário por ID
router.get('/:id', async (req, res) => {
    const client = getDbClient();
    try {
        await client.connect();

        const result = await client.query(`
            SELECT 
                u.id, u.nome, u.email, u.tipo, u.telefone, u.cargo,
                u.ativo,
                u."createdAt",
                u."updatedAt"
            FROM usuarios u
            WHERE u.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const usuario = {
            ...result.rows[0],
            roles: []
        };

        res.json(usuario);
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    } finally {
        await client.end();
    }
});

// POST /api/usuarios - Criar novo usuário
router.post('/', async (req, res) => {
    const client = getDbClient();
    try {
        const { nome, email, senha, telefone, cargo, tipo = 'usuario', ativo = true, permissoesCustom = {} } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);

        await client.connect();

        // Inserir usuário
        const userResult = await client.query(`
            INSERT INTO usuarios (nome, email, senha, tipo, telefone, cargo, ativo, permissoes_custom)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, nome, email, tipo, telefone, cargo, ativo, permissoes_custom as "permissoesCustom", "createdAt", "updatedAt"
        `, [nome, email, senhaHash, tipo, telefone, cargo, ativo, permissoesCustom]);

        const usuario = {
            ...userResult.rows[0],
            roles: []
        };

        res.status(201).json({
            success: true,
            data: usuario
        });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        res.status(500).json({ error: 'Erro ao criar usuário' });
    } finally {
        await client.end();
    }
});

// PUT /api/usuarios/:id - Atualizar usuário
router.put('/:id', async (req, res) => {
    const client = getDbClient();
    try {
        const { nome, email, senha, telefone, cargo, tipo, ativo, permissoesCustom } = req.body;

        await client.connect();

        // Preparar campos para atualizar
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (nome !== undefined) {
            updates.push(`nome = $${paramCount++}`);
            values.push(nome);
        }
        if (email !== undefined) {
            updates.push(`email = $${paramCount++}`);
            values.push(email);
        }
        if (senha) {
            const senhaHash = await bcrypt.hash(senha, 10);
            updates.push(`senha = $${paramCount++}`);
            values.push(senhaHash);
        }
        if (telefone !== undefined) {
            updates.push(`telefone = $${paramCount++}`);
            values.push(telefone);
        }
        if (cargo !== undefined) {
            updates.push(`cargo = $${paramCount++}`);
            values.push(cargo);
        }
        if (tipo !== undefined) {
            updates.push(`tipo = $${paramCount++}`);
            values.push(tipo);
        }
        if (ativo !== undefined) {
            updates.push(`ativo = $${paramCount++}`);
            values.push(ativo);
        }
        if (permissoesCustom !== undefined) {
            updates.push(`permissoes_custom = $${paramCount++}`);
            values.push(permissoesCustom);
        }

        updates.push(`"updatedAt" = CURRENT_TIMESTAMP`);
        values.push(req.params.id);

        // Atualizar usuário
        const result = await client.query(`
            UPDATE usuarios 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, nome, email, tipo, telefone, cargo, ativo, permissoes_custom as "permissoesCustom", "createdAt", "updatedAt"
        `, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const usuario = {
            ...result.rows[0],
            roles: []
        };

        res.json({
            success: true,
            data: usuario
        });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    } finally {
        await client.end();
    }
});

// DELETE /api/usuarios/:id - Excluir usuário
router.delete('/:id', async (req, res) => {
    const client = getDbClient();
    try {
        await client.connect();
        const result = await client.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ success: true, message: 'Usuário excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ error: 'Erro ao excluir usuário' });
    } finally {
        await client.end();
    }
});

module.exports = router;
