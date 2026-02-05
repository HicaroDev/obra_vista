const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restore() {
    const fileName = process.argv[2];

    if (!fileName) {
        console.error('❌ Erro: Nome do arquivo não fornecido.');
        process.exit(1);
    }

    const backupPath = path.join(__dirname, '../backups', fileName);

    if (!fs.existsSync(backupPath)) {
        console.error(`❌ Erro: Arquivo não encontrado em ${backupPath}`);
        process.exit(1);
    }

    console.log(`📦 Iniciando restauração do backup: ${fileName}...`);

    try {
        const fileContent = fs.readFileSync(backupPath, 'utf-8');
        const data = JSON.parse(fileContent);

        // Validação básica
        if (!data.metadata || data.metadata.type !== 'JSON_EXPORT') {
            console.error('❌ Erro: Formato de arquivo de backup inválido.');
            process.exit(1);
        }

        console.log('   ⚠️  ATENÇÃO: Limpando banco de dados atual para evitar conflitos...');
        // Ordem importa por causa das chaves estrangeiras
        // Deletar da mais dependente para a menos dependente
        await prisma.logs.deleteMany();
        await prisma.tarefa_anexos.deleteMany();
        await prisma.tarefa_checklists.deleteMany();
        await prisma.tarefa_compras.deleteMany();
        await prisma.tarefa_etiquetas.deleteMany();
        await prisma.tarefa_ocorrencias.deleteMany();
        await prisma.atribuicoes.deleteMany();

        await prisma.movimentacaoFerramentas.deleteMany();
        await prisma.frequencia.deleteMany();

        await prisma.equipes_Membros.deleteMany();
        await prisma.usuario_roles.deleteMany();
        await prisma.role_permissoes.deleteMany();

        await prisma.equipes.deleteMany();
        await prisma.prestadores.deleteMany();
        await prisma.obras.deleteMany();
        await prisma.usuarios.deleteMany(); // Cuidado com o admin, mas o backup deve ter ele

        await prisma.ferramentas.deleteMany();
        await prisma.produtos.deleteMany();
        await prisma.unidades.deleteMany();
        await prisma.especialidades.deleteMany();
        await prisma.etiquetas.deleteMany();
        await prisma.permissoes.deleteMany();
        await prisma.roles.deleteMany();

        console.log('   ✅ Banco limpo. Inserindo dados do backup...');

        // Inserir dados na ordem correta (da menos dependente para a mais dependente)

        // 1. Catálogos e Tabelas Base
        await prisma.unidades.createMany({ data: data.unidades || [] });
        await prisma.produtos.createMany({ data: data.produtos || [] });
        await prisma.especialidades.createMany({ data: data.especialidades || [] });
        await prisma.etiquetas.createMany({ data: data.etiquetas || [] });
        await prisma.roles.createMany({ data: data.roles || [] });
        await prisma.permissoes.createMany({ data: data.permissoes || [] });
        await prisma.ferramentas.createMany({ data: data.ferramentas || [] });

        // 2. Atores Principais
        await prisma.usuarios.createMany({ data: data.usuarios || [] });
        await prisma.prestadores.createMany({ data: data.prestadores || [] });
        await prisma.obras.createMany({ data: data.obras || [] });

        // 3. Relacionamentos e Estruturas
        await prisma.equipes.createMany({ data: data.equipes || [] });

        // Tabelas de junção não suportam createMany em alguns bancos se tiver chave composta complexa ou se o prisma reclamar
        // Mas no PostgreSQL com Prisma deve ir
        await prisma.equipes_Membros.createMany({ data: data.equipesMembros || [] });

        // 4. Transacional
        await prisma.atribuicoes.createMany({ data: data.atribuicoes || [] });
        await prisma.frequencia.createMany({ data: data.frequencia || [] });
        await prisma.movimentacaoFerramentas.createMany({ data: data.movimentacaoFerramentas || [] });

        // 5. Histórico e Logs
        if (data.logs && data.logs.length > 0) {
            await prisma.logs.createMany({ data: data.logs });
        }

        console.log('✅ Restauração concluída com sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro na restauração:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

restore();
