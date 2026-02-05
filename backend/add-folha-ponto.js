const { Client } = require('pg');
require('dotenv').config();

async function addFolhaPontoColumn() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔄 Conectando ao banco de dados...');
        await client.connect();
        console.log('✅ Conectado com sucesso!');

        console.log('🔨 Adicionando coluna usa_folha_ponto...');
        await client.query(`
            ALTER TABLE prestadores 
            ADD COLUMN IF NOT EXISTS usa_folha_ponto BOOLEAN DEFAULT true;
        `);

        console.log('✅ Coluna adicionada com sucesso!');

        await client.end();
        console.log('👋 Conexão fechada.');
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

addFolhaPontoColumn();
