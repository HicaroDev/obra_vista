const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de Unidades, Produtos e Especialidades...');

    // 1. ESPECIALIDADES (Tipos de Prestadores)
    const especialidades = [
        'Pedreiro',
        'Eletricista',
        'Encanador',
        'Pintor',
        'Serralheiro',
        'Marceneiro',
        'Gesseiro',
        'Vidraceiro',
        'Arquiteto',
        'Engenheiro'
    ];

    console.log('\n🔧 Criando especialidades...');
    for (const nome of especialidades) {
        const exists = await prisma.especialidades.findFirst({ where: { nome } });
        if (!exists) {
            await prisma.especialidades.create({ data: { nome } });
            console.log(`  ✅ Criado: ${nome}`);
        }
    }

    // 2. UNIDADES
    const unidades = [
        { nome: 'Unidade', sigla: 'un' },
        { nome: 'Metro', sigla: 'm' },
        { nome: 'Metro Quadrado', sigla: 'm²' },
        { nome: 'Metro Cúbico', sigla: 'm³' },
        { nome: 'Quilograma', sigla: 'kg' },
        { nome: 'Litro', sigla: 'l' },
        { nome: 'Caixa', sigla: 'cx' },
        { nome: 'Saco', sigla: 'sc' },
        { nome: 'Tonelada', sigla: 'ton' },
        { nome: 'Par', sigla: 'par' },
        { nome: 'Galão', sigla: 'gal' }
    ];

    console.log('\n📏 Criando unidades...');
    for (const u of unidades) {
        const exists = await prisma.unidades.findFirst({
            where: { OR: [{ nome: u.nome }, { sigla: u.sigla }] }
        });
        if (!exists) {
            await prisma.unidades.create({ data: u });
            console.log(`  ✅ Criado: ${u.nome} (${u.sigla})`);
        }
    }

    // 3. PRODUTOS (Exemplos)
    const produtos = [
        { nome: 'Cimento CP II', unidade: 'sc' },
        { nome: 'Areia Média', unidade: 'm³' },
        { nome: 'Pedra Brita 1', unidade: 'm³' },
        { nome: 'Tijolo Baiano', unidade: 'un' },
        { nome: 'Tinta Acrílica Branca', unidade: 'l' },
        { nome: 'Cabo Flexível 2.5mm', unidade: 'm' },
        { nome: 'Tubo PVC 100mm', unidade: 'm' },
        { nome: 'Argamassa ACIII', unidade: 'sc' },
        { nome: 'Piso Cerâmico 60x60', unidade: 'm²' },
        { nome: 'Rejunte Branco', unidade: 'kg' }
    ];

    console.log('\n📦 Criando produtos de exemplo...');
    for (const p of produtos) {
        const exists = await prisma.produtos.findFirst({ where: { nome: p.nome } });
        if (!exists) {
            await prisma.produtos.create({ data: p });
            console.log(`  ✅ Criado: ${p.nome}`);
        }
    }

    console.log('\n🎉 Seed complementar finalizado com sucesso!');
}

main()
    .catch((e) => {
        console.error('❌ Erro:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
