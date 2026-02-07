const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('📋 Populando perguntas de vistoria técnica...');
    const PERGUNTAS = [
        { texto: 'Área total da reforma (m²)', tipo: 'numero', categoria: 'Medições', slug: 'm2_total', ordem: 1 },
        { texto: 'Área de pintura de paredes (m²)', tipo: 'numero', categoria: 'Medições', slug: 'm2_parede', ordem: 2 },
        { texto: 'Necessita demolição de alvenaria?', tipo: 'booleano', categoria: 'Demolição', slug: 'demolicao_alvenaria', ordem: 3 },
        { texto: 'Necessita remoção de entulho (caçambas)?', tipo: 'booleano', categoria: 'Demolição', slug: 'remocao_entulho', ordem: 4 },
        { texto: 'Tipo de piso a ser instalado', tipo: 'texto', categoria: 'Revestimentos', slug: 'tipo_piso', ordem: 5 },
        { texto: 'Troca de fiação completa?', tipo: 'booleano', categoria: 'Elétrica', slug: 'fiacao_completa', ordem: 6 },
        { texto: 'Possui elevador de serviço?', tipo: 'booleano', categoria: 'Logística', slug: 'possui_elevador', ordem: 7 },
    ];

    for (const item of PERGUNTAS) {
        await prisma.crmPergunta.upsert({
            where: { slug: item.slug },
            update: {},
            create: item
        });
    }
    console.log('✅ Perguntas de vistoria prontas!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
