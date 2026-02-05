const fs = require('fs');
const path = require('path');

const PDF_PATH = 'C:\\Users\\Ione\\OneDrive\\Área de Trabalho\\DEV\\Obra_vista\\banco de dados de obra.pdf';

async function debug() {
    console.log('--- DEBUG INICIO ---');
    console.log('1. Verificando arquivo...');
    if (fs.existsSync(PDF_PATH)) {
        console.log(`   ✅ Arquivo existe! Tamanho: ${fs.statSync(PDF_PATH).size} bytes`);
    } else {
        console.log(`   ❌ Arquivo NÃO encontrado: ${PDF_PATH}`);
    }

    console.log('2. Verificando pdf-parse...');
    try {
        const pdfLib = require('pdf-parse');
        console.log(`   Tipo: ${typeof pdfLib}`);
        console.log(`   Is Function? ${typeof pdfLib === 'function'}`);
        console.log(`   Exporta:`, pdfLib);

        if (typeof pdfLib === 'object') {
            console.log(`   Keys:`, Object.keys(pdfLib));
            if (pdfLib.default) {
                console.log(`   Default export:`, pdfLib.default);
            }
        }

        if (fs.existsSync(PDF_PATH)) {
            console.log('3. Tentando ler PDF...');
            const buffer = fs.readFileSync(PDF_PATH);

            let parseFunc = pdfLib;
            if (typeof parseFunc !== 'function' && pdfLib.default) {
                parseFunc = pdfLib.default;
            }

            if (typeof parseFunc === 'function') {
                const data = await parseFunc(buffer);
                console.log('   ✅ Leitura com SUCESSO!');
                console.log('   Texto extraído (inicio):');
                console.log(data.text.substring(0, 500));
            } else {
                console.log('   ❌ Não foi possível identificar a função de parse.');
            }
        }

    } catch (e) {
        console.error('   ❌ Erro ao importar/usar pdf-parse:', e);
    }
    console.log('--- DEBUG FIM ---');
}

debug();
