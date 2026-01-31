const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function createTables() {
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

        console.log('📄 Lendo script SQL...');
        const sqlPath = path.join(__dirname, 'prisma', 'create-tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🔨 Executando script de criação de tabelas...');
        await client.query(sql);

        console.log('✅ Tabelas criadas com sucesso!');
        console.log('\n📊 Tabelas criadas:');
        console.log('  ✓ usuarios');
        console.log('  ✓ prestadores');
        console.log('  ✓ equipes');
        console.log('  ✓ equipes_membros');
        console.log('  ✓ obras');
        console.log('  ✓ atribuicoes');
        console.log('  ✓ logs');

        await client.end();
        console.log('\n👋 Conexão fechada.');
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error(error);
        process.exit(1);
    }
}

createTables();
