const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
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

    console.log('Iniciando seed de unidades...');

    for (const u of unidades) {
        const exists = await prisma.unidades.findFirst({
            where: {
                OR: [
                    { nome: u.nome },
                    { sigla: u.sigla }
                ]
            }
        });

        if (!exists) {
            await prisma.unidades.create({
                data: u
            });
            console.log(`Criada unidade: ${u.nome} (${u.sigla})`);
        } else {
            console.log(`Unidade já existe: ${u.nome} (${u.sigla})`);
        }
    }

    console.log('Seed finalizado com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
