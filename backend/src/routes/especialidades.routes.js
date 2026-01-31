const express = require('express');
const router = express.Router();
const { Client } = require('pg');

// Configuração do banco de dados
const getDbClient = () => {
    return new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
};

// Listar todas as especialidades
router.get('/', async (req, res) => {
    const client = getDbClient();
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM especialidades ORDER BY nome ASC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Erro ao buscar especialidades:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar especialidades' });
    } finally {
        await client.end();
    }
});

// Criar nova especialidade
router.post('/', async (req, res) => {
    const { nome } = req.body;
    if (!nome) {
        return res.status(400).json({ success: false, message: 'Nome da especialidade é obrigatório' });
    }

    const client = getDbClient();
    try {
        await client.connect();
        const result = await client.query(
            'INSERT INTO especialidades (nome) VALUES ($1) RETURNING *',
            [nome]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erro ao criar especialidade:', error);
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ success: false, message: 'Esta especialidade já existe' });
        }
        res.status(500).json({ success: false, message: 'Erro ao criar especialidade' });
    } finally {
        await client.end();
    }
});

// Atualizar especialidade
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({ success: false, message: 'Nome da especialidade é obrigatório' });
    }

    const client = getDbClient();
    try {
        await client.connect();

        // Verificar se a especialidade existe
        const currentRes = await client.query('SELECT nome FROM especialidades WHERE id = $1', [id]);
        if (currentRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Especialidade não encontrada' });
        }

        const antigoNome = currentRes.rows[0].nome;

        // Atualizar a especialidade
        await client.query(
            'UPDATE especialidades SET nome = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
            [nome, id]
        );

        // Opcional: Atualizar o nome da especialidade na tabela de prestadores para manter a consistência
        // Já que a tabela prestadores armazena o NOME da especialidade (string) e não o ID.
        await client.query(
            'UPDATE prestadores SET especialidade = $1 WHERE especialidade = $2',
            [nome, antigoNome]
        );

        res.json({ success: true, message: 'Especialidade atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar especialidade:', error);
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'Esta especialidade já existe' });
        }
        res.status(500).json({ success: false, message: 'Erro ao atualizar especialidade' });
    } finally {
        await client.end();
    }
});

// Excluir especialidade
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const client = getDbClient();
    try {
        await client.connect();

        // Verificar se existem prestadores usando esta especialidade
        const espResult = await client.query('SELECT nome FROM especialidades WHERE id = $1', [id]);
        if (espResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Especialidade não encontrada' });
        }

        const especialidadeNome = espResult.rows[0].nome;
        const prestadoresResult = await client.query('SELECT COUNT(*) FROM prestadores WHERE especialidade = $1', [especialidadeNome]);

        if (parseInt(prestadoresResult.rows[0].count) > 0) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível excluir esta especialidade pois existem prestadores vinculados a ela.'
            });
        }

        await client.query('DELETE FROM especialidades WHERE id = $1', [id]);
        res.json({ success: true, message: 'Especialidade excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir especialidade:', error);
        res.status(500).json({ success: false, message: 'Erro ao excluir especialidade' });
    } finally {
        await client.end();
    }
});

module.exports = router;
