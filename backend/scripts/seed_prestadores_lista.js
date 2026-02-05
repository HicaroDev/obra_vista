const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PRESTADORES_IMPORT = [
    { nome: 'Diolgo de Araújo Souza', especialidade: 'Mestre de Obras' },
    { nome: 'Evandro da cruz', especialidade: 'Pedreiro' },
    { nome: 'Wagner Gonçalves Gonzaga', especialidade: 'Servente' },
    { nome: 'Adriano Almeida Dos Santos - Marinho', especialidade: 'Pedreiro' },
    { nome: 'Luiz Gonzaga Araújo - Marinho', especialidade: 'Servente' },
    { nome: 'Renato Almeida dos Santos - Marinho', especialidade: 'Servente' },
    { nome: 'Antônio Claudino da Silva Neto - Marinho', especialidade: 'Mestre de Obras' },
    { nome: 'Alexandre Gonçalves Amaral', especialidade: 'Servente' },
    { nome: 'Antônio Carlos Souza de Jesus', especialidade: 'Servente' },
    { nome: 'Carlos Henrique Ferreira Dos Santos', especialidade: 'Servente' },
    { nome: 'Luiz Henrique Condes Pereira de Jesus', especialidade: 'Servente' },
    { nome: 'Weibo Pereira dos Santos', especialidade: 'Servente' },
    { nome: 'Anderson Ricardo', especialidade: 'Pedreiro' },
    { nome: 'Fábio Batista Alves', especialidade: 'Mestre de Obras' },
    { nome: 'Valmir Costa Alves', especialidade: 'Pedreiro' },
    { nome: 'José Carlos de Oliveira', especialidade: 'Pedreiro' },
    { nome: 'José Luciano Medeiros Cardoso', especialidade: 'Servente' },
    { nome: 'Kauê Araújo de Oliveira', especialidade: 'Servente' },
    { nome: 'Juscelino Dias da Silva', especialidade: 'Pedreiro' },
    { nome: 'Ronalt Almeida', especialidade: 'Servente' },
    { nome: 'Paulo Fernandes da Cunha', especialidade: 'Pedreiro' },
    { nome: 'Paulo Enrique Anjos dos Santos', especialidade: 'Servente' },
    { nome: 'Samuel Vinícius Vieira Franco', especialidade: 'Servente' },
    { nome: 'Janesval Fernandes da Silva', especialidade: 'Serralheiro', observacao: 'Auxiliar de Serralheiro B' },
    { nome: 'Adriano Mamedio de Souza', especialidade: 'Pedreiro', tipo_contrato: 'empreita', observacao: 'EMPREITA' },
    { nome: 'Valmir Alves Rodrigues', especialidade: 'Mestre de Obras' },
    { nome: 'Otaciel Gomes da Silva', especialidade: 'Serralheiro', observacao: 'Serralheiro A' },
    { nome: 'Wesley Santos Santos', especialidade: 'Serralheiro', observacao: 'Serralheiro B' },
    { nome: 'José Cristinelson dos Santos Neves', especialidade: 'Serralheiro', observacao: 'Serralheiro B Lider' },
    { nome: 'Erick Henrique de jesus Prado', especialidade: 'Servente' },
    { nome: 'David Eduardo Neves', especialidade: 'Serralheiro', observacao: 'Serralheiro B' },
    { nome: 'Cosmo Jesus dos Santos', especialidade: 'Pedreiro' },
    { nome: 'Ronaldo Willames Lima de Oliveira', especialidade: 'Motorista' }
];

async function main() {
    console.log('👷 Iniciando importação de prestadores da lista...');

    let count = 0;
    for (const p of PRESTADORES_IMPORT) {
        // Tenta encontrar por nome (como não temos CPF/Email na lista, usaremos Nome como chave única para este seed)
        // Na prática o banco não tem unique no nome, mas vamos evitar duplicar
        const existente = await prisma.prestadores.findFirst({
            where: { nome: p.nome }
        });

        if (!existente) {
            await prisma.prestadores.create({
                data: {
                    nome: p.nome.trim(),
                    especialidade: p.especialidade,
                    tipo_contrato: p.tipo_contrato || 'diaria', // Default para diaria se não especificado
                    ativo: true,
                    usa_folha_ponto: true,
                    // Campos opcionais que não temos, deixamos null ou defaults
                }
            });
            // console.log(`  ✅ Criado: ${p.nome} (${p.especialidade})`);
            count++;
        } else {
            console.log(`  ℹ️  Já existe: ${p.nome}`);
        }
    }

    console.log(`\n🎉 Processo concluído! ${count} novos prestadores adicionados.`);
}

main()
    .catch((e) => {
        console.error('❌ Erro na importação:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
