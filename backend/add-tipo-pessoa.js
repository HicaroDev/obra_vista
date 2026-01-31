const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function addTipoPessoa() {
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
        const sqlPath = path.join(__dirname, 'prisma', 'add-tipo-pessoa.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🔨 Adicionando campos tipo_pessoa e CNPJ...');
        await client.query(sql);

        console.log('✅ Campos adicionados com sucesso!');
        console.log('\n📊 Campos adicionados:');
        console.log('  ✓ tipo_pessoa (PF/PJ)');
        console.log('  ✓ cnpj');

        await client.end();
        console.log('\n👋 Conexão fechada.');
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error(error);
        process.exit(1);
    }
}

addTipoPessoa();
