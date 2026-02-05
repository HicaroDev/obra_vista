const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const UNIDADES = [
    { nome: 'Metro', sigla: 'm' },
    { nome: 'Metro Quadrado', sigla: 'm²' },
    { nome: 'Metro Cúbico', sigla: 'm³' },
    { nome: 'Quilo', sigla: 'kg' },
    { nome: 'Saco', sigla: 'sc' },
    { nome: 'Unidade', sigla: 'un' },
    { nome: 'Litro', sigla: 'l' },
    { nome: 'Barra', sigla: 'br' },
    { nome: 'Caixa', sigla: 'cx' },
    { nome: 'Rolo', sigla: 'rl' },
    { nome: 'Par', sigla: 'par' },
    { nome: 'Jogo', sigla: 'jg' }
];

const PRODUTOS = [
    { nome: 'Cimento CP-II', unidade: 'sc' },
    { nome: 'Areia Média', unidade: 'm³' },
    { nome: 'Areia Fina', unidade: 'm³' },
    { nome: 'Pedra Brita 1', unidade: 'm³' },
    { nome: 'Cal Hidratada', unidade: 'sc' },
    { nome: 'Tijolo Cerâmico 8 furos', unidade: 'un' },
    { nome: 'Bloco de Concreto 14x19x39', unidade: 'un' },
    { nome: 'Argamassa AC-I', unidade: 'sc' },
    { nome: 'Argamassa AC-II', unidade: 'sc' },
    { nome: 'Argamassa AC-III', unidade: 'sc' },
    { nome: 'Tinta Acrílica Fosca Branco Neve (18L)', unidade: 'l' },
    { nome: 'Massa Corrida (Barrica)', unidade: 'un' },
    { nome: 'Cano PVC Soldável 25mm', unidade: 'br' },
    { nome: 'Cano PVC Soldável 50mm', unidade: 'br' },
    { nome: 'Cano PVC Esgoto 100mm', unidade: 'br' },
    { nome: 'Luva PVC 25mm', unidade: 'un' },
    { nome: 'Joelho 90° PVC 25mm', unidade: 'un' },
    { nome: 'Fio Flexível 2.5mm', unidade: 'rl' },
    { nome: 'Fio Flexível 4.0mm', unidade: 'rl' },
    { nome: 'Disjuntor Unipolar 20A', unidade: 'un' },
    { nome: 'Tomada 10A com Placa', unidade: 'un' },
    { nome: 'Interruptor Simples com Placa', unidade: 'un' },
    { nome: 'Vergalhão 3/8 (10mm)', unidade: 'br' },
    { nome: 'Vergalhão 5/16 (8mm)', unidade: 'br' },
    { nome: 'Arame Recozido', unidade: 'kg' },
    { nome: 'Prego 18x27', unidade: 'kg' }
];

async function main() {
    console.log('🌱 Semeando Unidades e Produtos...');

    // 1. Criar Unidades
    console.log('📏 Criando unidades...');
    for (const item of UNIDADES) {
        try {
            await prisma.unidades.upsert({
                where: { sigla: item.sigla },
                update: {},
                create: item
            });
            // console.log(`  ✅ Unidade: ${item.nome} (${item.sigla})`);
        } catch (e) {
            console.warn(`  ⚠️ Erro ao criar unidade ${item.nome}: ${e.message}`);
        }
    }
    console.log(`  ✅ ${UNIDADES.length} unidades processadas.`);

    // 2. Criar Produtos
    console.log('🧱 Criando produtos...');
    for (const item of PRODUTOS) {
        try {
            await prisma.produtos.upsert({
                where: { nome: item.nome },
                update: {},
                create: item
            });
            // console.log(`  ✅ Produto: ${item.nome}`);
        } catch (e) {
            console.warn(`  ⚠️ Erro ao criar produto ${item.nome}: ${e.message}`);
        }
    }
    console.log(`  ✅ ${PRODUTOS.length} produtos processados.`);

    console.log('✨ Seed de produtos e unidades concluído com sucesso!');
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
