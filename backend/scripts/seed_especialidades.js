const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ESPECIALIDADES = [
    // Básicos
    'Pedreiro',
    'Servente',
    'Ajudante Geral',
    'Mestre de Obras',
    'Encarregado',

    // Acabamento
    'Pintor',
    'Gesseiro',
    'Azulejista',
    'Vidraceiro',
    'Marceneiro',
    'Serralheiro',

    // Instalações
    'Eletricista',
    'Encanador',
    'Bombeiro Hidráulico',
    'Instalador de Ar Condicionado',
    'Técnico de Redes',

    // Estrutural
    'Carpinteiro',
    'Armador',
    'Concretista',
    'Soldador',
    'Telhadista',
    'Impermeabilizador',

    // Máquinas e Equipamentos
    'Operador de Betoneira',
    'Operador de Escavadeira',
    'Motorista',
    'Operador de Munck',

    // Técnicos e Engenharia
    'Engenheiro Civil',
    'Arquiteto',
    'Topógrafo',
    'Técnico de Segurança do Trabalho',
    'Desenhista Cadista',
    'Orçamentista',

    // Outros
    'Jardineiro',
    'Almoxarife',
    'Vigia/Porteiro',
    'Auxiliar Administrativo'
];

async function main() {
    console.log('🛠️ Semenado Tipos de Prestadores (Especialidades)...');

    let count = 0;
    for (const nome of ESPECIALIDADES) {
        try {
            await prisma.especialidades.upsert({
                where: { nome },
                update: {},
                create: { nome }
            });
            // console.log(`  ✅ Especialidade: ${nome}`);
            count++;
        } catch (e) {
            console.warn(`  ⚠️ Erro ao criar ${nome}: ${e.message}`);
        }
    }

    console.log(`✅ ${count} especialidades processadas com sucesso!`);
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed de especialidades:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
