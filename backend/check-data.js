const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log('🔍 Verificando dados no banco...');

        // Nomes dos modelos corrigidos para bater com o schema.prisma (plural)
        const usuarios = await prisma.usuarios.count();
        const obras = await prisma.obras.count();
        const equipes = await prisma.equipes.count();
        const prestadores = await prisma.prestadores.count();

        console.log('📊 Contagem de Registros:');
        console.log(`- Usuários: ${usuarios}`);
        console.log(`- Obras: ${obras}`);
        console.log(`- Equipes: ${equipes}`);
        console.log(`- Prestadores: ${prestadores}`);

        if (usuarios === 0 && obras === 0 && equipes === 0 && prestadores === 0) {
            console.log('\n⚠️ O banco de dados está VAZIO.');
            console.log('Isso pode ter acontecido se você rodou "prisma migrate reset" ou conectou em um banco novo.');
        } else {
            console.log('\n✅ O banco de dados CONTÉM dados.');

            // Listar primeiros usuarios para confirmação
            if (usuarios > 0) {
                console.log('\nExemplos de usuários encontrados:');
                const users = await prisma.usuarios.findMany({ take: 3, select: { nome: true, email: true } });
                console.table(users);
            }
        }

    } catch (error) {
        console.error('❌ Erro ao verificar dados:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
