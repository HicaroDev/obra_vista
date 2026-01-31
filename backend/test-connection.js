const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('🔄 Tentando conectar ao banco de dados...');
    console.log('📍 URL:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'));
    
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    const result = await client.query('SELECT version()');
    console.log('📊 Versão do PostgreSQL:', result.rows[0].version);
    
    await client.end();
    console.log('👋 Conexão fechada.');
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    console.error('🔍 Detalhes:', error);
    process.exit(1);
  }
}

testConnection();
