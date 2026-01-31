const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function createEspecialidades() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔄 Conectando ao banco de dados...');
        await client.connect();
        console.log('✅ Conectado com sucesso!');

        const sqlPath = path.join(__dirname, 'prisma', 'create-especialidades.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🔨 Criando tabela de especialidades...');
        await client.query(sql);
        console.log('✅ Tabela e dados iniciais criados com sucesso!');

    } catch (err) {
        console.error('❌ Erro na migração:', err);
    } finally {
        await client.end();
        console.log('👋 Conexão fechada.');
    }
}

createEspecialidades();
