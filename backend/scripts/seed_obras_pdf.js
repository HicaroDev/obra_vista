const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Importação robusta do pdf-parse
let pdfLib = require('pdf-parse');
// Tratamento para variações de export (CommonJS vs ES Module interop)
if (typeof pdfLib !== 'function' && pdfLib.default) {
    pdfLib = pdfLib.default;
}

const prisma = new PrismaClient();

async function extractFromPdf(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ VIXE! Arquivo não encontrado no caminho: ${filePath}`);
        return [];
    }

    try {
        console.log('📖 Lendo arquivo PDF...');
        const dataBuffer = fs.readFileSync(filePath);

        if (typeof pdfLib !== 'function') {
            throw new Error(`Biblioteca pdf-parse não carregou corretamente. Tipo: ${typeof pdfLib}`);
        }

        const data = await pdfLib(dataBuffer);
        const text = data.text;

        console.log('✅ PDF decodificado! Analisando texto...');
        // console.log('--- INICIO DO TEXTO ---');
        // console.log(text.substring(0, 500)); 
        // console.log('--- FIM DO PREVIEW ---');

        const obras = [];
        const lines = text.split('\n');

        // Lógica de parser melhorada
        // Vamos procurar linhas que pareçam nomes de obras
        // Ignorando lixo comum de cabeçalhos
        for (const line of lines) {
            const cleanLine = line.trim();

            // Filtros para ignorar linhas inúteis
            if (cleanLine.length < 5) continue;
            if (cleanLine.match(/^\d+$/)) continue; // Só números
            if (cleanLine.includes('Obra Vista')) continue;
            if (cleanLine.includes('Relatório')) continue;
            if (cleanLine.includes('Página')) continue;
            if (cleanLine.includes('Data:')) continue;

            // Se passar pelos filtros, assume que é uma obra (ou parte dela)
            // Em um mundo ideal, teríamos um padrão (Ex: "Obra: Nome")
            // Vamos assumir que cada linha válida é um potencial nome

            // Evitar duplicatas na lista local
            if (!obras.some(o => o.nome === cleanLine)) {
                obras.push({
                    nome: cleanLine,
                    endereco: 'Endereço a atualizar',
                    status: 'em_andamento'
                });
            }
        }

        return obras;

    } catch (e) {
        console.error('❌ Erro fatal ao ler PDF:', e);
        return [];
    }
}

async function main() {
    // Caminho exato fornecido
    const pdfPath = 'C:\\Users\\Ione\\OneDrive\\Área de Trabalho\\DEV\\Obra_vista\\banco de dados de obra.pdf';

    console.log(`🚀 Iniciando importação do arquivo: ${pdfPath}`);

    const obrasEncontradas = await extractFromPdf(pdfPath);

    if (obrasEncontradas.length === 0) {
        console.log('⚠️ Nenhuma obra encontrada ou erro na leitura.');
        return;
    }

    console.log(`📋 Encontradas ${obrasEncontradas.length} linhas/obras. Processando banco de dados...`);

    let criadas = 0;
    let existentes = 0;

    for (const obra of obrasEncontradas) {
        try {
            // Verifica duplicidade no banco (case insensitive)
            const existing = await prisma.obras.findFirst({
                where: {
                    nome: {
                        equals: obra.nome,
                        mode: 'insensitive'
                    }
                }
            });

            if (!existing) {
                await prisma.obras.create({
                    data: {
                        nome: obra.nome.substring(0, 255), // Garante limite do campo
                        endereco: obra.endereco,
                        status: 'em_andamento',
                        descricao: 'Importado autom. do PDF'
                    }
                });
                console.log(`  ✅ Criada: ${obra.nome}`);
                criadas++;
            } else {
                console.log(`  ℹ️  Já existe: ${obra.nome}`);
                existentes++;
            }
        } catch (e) {
            console.warn(`  💥 Falha ao salvar "${obra.nome}": ${e.message}`);
        }
    }

    console.log(`\n📊 RESUMO DA IMPORTAÇÃO:`);
    console.log(`   Novas obras: ${criadas}`);
    console.log(`   Já existentes: ${existentes}`);
}

main()
    .catch((e) => {
        console.error('❌ Erro no script:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
