const { PrismaClient } = require('@prisma/client');

// Criar instância única do Prisma Client (Singleton)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Testar conexão ao iniciar
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma conectado ao banco de dados!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error.message);
    return false;
  }
}

// Executar teste de conexão
testConnection();

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log('🔌 Prisma desconectado do banco de dados');
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('\n🔌 Prisma desconectado do banco de dados');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  console.log('🔌 Prisma desconectado do banco de dados');
  process.exit(0);
});

// Exportar instância do Prisma
module.exports = prisma;
