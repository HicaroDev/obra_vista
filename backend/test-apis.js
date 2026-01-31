// Script de teste para verificar se todas as correções estão funcionando
const http = require('http');

const API_URL = 'http://localhost:3001';

async function testarAPI(endpoint, metodo = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: endpoint,
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function executarTestes() {
    console.log('🔍 TESTANDO TODAS AS APIS...\n');

    const testes = [
        { nome: 'Dashboard Stats', endpoint: '/api/dashboard/stats' },
        { nome: 'Dashboard Atividades', endpoint: '/api/dashboard/atividades' },
        { nome: 'Usuários', endpoint: '/api/usuarios' },
        { nome: 'Prestadores', endpoint: '/api/prestadores' },
        { nome: 'Equipes', endpoint: '/api/equipes' },
        { nome: 'Obras', endpoint: '/api/obras' },
        { nome: 'Roles', endpoint: '/api/roles' },
    ];

    for (const teste of testes) {
        try {
            const resultado = await testarAPI(teste.endpoint);
            if (resultado.status === 200) {
                console.log(`✅ ${teste.nome}: OK`);
                if (resultado.data.success !== undefined) {
                    console.log(`   - Success: ${resultado.data.success}`);
                    if (Array.isArray(resultado.data.data)) {
                        console.log(`   - Registros: ${resultado.data.data.length}`);
                    }
                } else if (Array.isArray(resultado.data)) {
                    console.log(`   - Registros: ${resultado.data.length}`);
                }
            } else {
                console.log(`❌ ${teste.nome}: ERRO ${resultado.status}`);
                console.log(`   - Mensagem: ${JSON.stringify(resultado.data)}`);
            }
        } catch (error) {
            console.log(`❌ ${teste.nome}: ERRO DE CONEXÃO`);
            console.log(`   - ${error.message}`);
        }
        console.log('');
    }

    console.log('\n📊 TESTE CONCLUÍDO!\n');
}

executarTestes();
