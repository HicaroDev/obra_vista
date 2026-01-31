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

// GET /api/roles - Listar todos os roles
router.get('/', async (req, res) => {
    const client = getDbClient();
    try {
        await client.connect();
        const result = await client.query(`
            SELECT 
                id, nome, descricao, nivel,
                created_at as "createdAt"
            FROM roles 
            ORDER BY nivel ASC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar roles:', error);
        res.status(500).json({ error: 'Erro ao buscar roles' });
    } finally {
        await client.end();
    }
});

// GET /api/roles/:id - Buscar role por ID com permissões
router.get('/:id', async (req, res) => {
    const client = getDbClient();
    try {
        await client.connect();

        const result = await client.query(`
            SELECT 
                r.id, r.nome, r.descricao, r.nivel,
                r.created_at as "createdAt",
                json_agg(
                    json_build_object(
                        'id', p.id,
                        'modulo', p.modulo,
                        'acao', p.acao,
                        'descricao', p.descricao
                    )
                ) FILTER (WHERE p.id IS NOT NULL) as permissoes
            FROM roles r
            LEFT JOIN role_permissoes rp ON r.id = rp.role_id
            LEFT JOIN permissoes p ON rp.permissao_id = p.id
            WHERE r.id = $1
            GROUP BY r.id
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Role não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar role:', error);
        res.status(500).json({ error: 'Erro ao buscar role' });
    } finally {
        await client.end();
    }
});

module.exports = router;
