const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function backup() {
    console.log('📦 Iniciando backup via Prisma (Exportação JSON)...');

    try {
        // Diretório de backups
        const backupDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // Nome do arquivo com timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup_${timestamp}.json`;
        const filePath = path.join(backupDir, fileName);

        // Coletar dados de todas as tabelas
        console.log('   Lendo dados do banco...');

        const data = {
            metadata: {
                version: '1.0',
                createdAt: new Date().toISOString(),
                type: 'JSON_EXPORT'
            },
            usuarios: await prisma.usuarios.findMany(),
            prestadores: await prisma.prestadores.findMany(),
            obras: await prisma.obras.findMany(),
            equipes: await prisma.equipes.findMany(),
            equipesMembros: await prisma.equipes_Membros.findMany(),
            atribuicoes: await prisma.atribuicoes.findMany(),
            // Tabelas auxiliares
            especialidades: await prisma.especialidades.findMany(),
            unidades: await prisma.unidades.findMany(),
            produtos: await prisma.produtos.findMany(),
            etiquetas: await prisma.etiquetas.findMany(),
            roles: await prisma.roles.findMany(),
            permissoes: await prisma.permissoes.findMany(),
            // Dados transacionais (podem ser grandes, mas essenciais)
            frequencia: await prisma.frequencia.findMany(),
            logs: await prisma.logs.findMany({ take: 1000, orderBy: { createdAt: 'desc' } }), // Limitar logs aos últimos 1000 para não explodir
            ferramentas: await prisma.ferramentas.findMany(),
            movimentacaoFerramentas: await prisma.movimentacaoFerramentas.findMany(),
        };

        // Salvar arquivo
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        console.log(`✅ Backup salvo com sucesso em: ${fileName}`);

        // Retornar o caminho para o controller capturar se necessário (stdout)
        console.log(`PATH:${filePath}`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Erro no backup:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

backup();
