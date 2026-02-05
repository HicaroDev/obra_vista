const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const OBRAS_DATA = [
    { nome: "3Radial", cliente: "Dr.Francisco", endereco: "Avenida Terceira Radial Qd.128,lt.14 Goiania, Setor Pedro Ludovico 74820-100", tipo: "Comercial" },
    { nome: "AbadiaLuaPark", cliente: "Alexandro Centeno Faria", endereco: "Rua LP-22 Quadra:06 Lote:04 Abadia de Goiás, Residencial Luar Park 75321-742", tipo: "Comercial" },
    { nome: "Anapolis", cliente: "Avelino Rosseti Junior", endereco: "Rua Contorno Esq. Com Rua Jonas Duarte Quadra:30 Lote:01 Anapolis, Calixtolândia 75130-530", tipo: "Comercial" },
    { nome: "CasaJardimProgresso", cliente: "Jaime", endereco: "Avenida Bela Vista Quadra:02 Lote:09, Aparecida de Goiânia, Vila Santo Antônio - Segundo Acréscimo 74911-720", tipo: "Residencial" },
    { nome: "CasaMariliza", cliente: "Joselane De Lima Nunes Oliveira", endereco: "Rua Copaíba Quadra: 79 Lote: 07 Goiânia, Jardim Mariliza 74885-140", tipo: "Residencial" },
    { nome: "CasaValeVerde", cliente: "Rogerio Santos de Teive Argolo", endereco: "Rua VV4 Quadra: 07 Lote: 08 Senador Canedo, Condomínio Vale Verde 75250-000", tipo: "Residencial" },
    { nome: "ChacaraFazendaPetropolis", cliente: "Fernando Gomes Mendonça", endereco: "Chacara Fazenda Petropolis, Goiania", tipo: "Residencial" },
    { nome: "Gessolar", cliente: "Osmar Chiarello", endereco: "Rua 14 Quadra: 48 Lote: 07 Goiânia, Jardim Santo Antônio 74853-270", tipo: "Comercial" },
    { nome: "Guanabara", cliente: "", endereco: "Goias", tipo: "Residencial" },
    { nome: "LavajatoRioVerde", cliente: "Vinicius Machado", endereco: "Avenida Rio Verde Quadra: 29 Lote: 23 Goiânia, Vila Rosa 74843-660", tipo: "Comercial" },
    { nome: "NowParqueAmazonas", cliente: "", endereco: "", tipo: "Residencial" },
    { nome: "Orizona", cliente: "", endereco: "", tipo: "Residencial" },
    { nome: "OrizonaSPE", cliente: "", endereco: "", tipo: "Residencial" },
    { nome: "AllPark", cliente: "Osmar Chiarello", endereco: "Avenida Tanner de Melo Quadra: 04 Lote: 07 Aparecida de Goiânia, All Park Polo Empresarial 74988-850", tipo: "Comercial" },
    { nome: "Gessolar5", cliente: "Osmar Chiarello", endereco: "Rua 14 Quadra: 48 Lote 05 Goiânia, Jardim Santo Antônio 74853-270", tipo: "Comercial" },
    { nome: "LavajatoBSB", cliente: "Vinicius Machado", endereco: "Quadra QS 3 Rua 420, Lote 04 Brasília, Areal (Águas Claras) 71953-100", tipo: "Comercial" },
    { nome: "Casa J-72", cliente: "Ione Da Silva Moreira", endereco: "Rua J72 Quadra: 145 Lote: 12, Sobrado 3 Goiânia, Setor Jaó 74674-390", tipo: "Residencial" },
    { nome: "Gessolar7", cliente: "Osmar Chiarello", endereco: "Rua 14 Quadra: 48 Lote: 07 Goiânia, Jardim Santo Antônio 74853-270", tipo: "Comercial" }
];

async function main() {
    console.log('🏗️  Iniciando importação de obras da lista fornecida...');

    let count = 0;
    for (const obra of OBRAS_DATA) {
        try {
            const existing = await prisma.obras.findFirst({
                where: { nome: { equals: obra.nome, mode: 'insensitive' } }
            });

            if (!existing) {
                // Monta a descrição com cliente
                const descricao = obra.cliente ? `Cliente: ${obra.cliente} | Tipo: ${obra.tipo}` : `Tipo: ${obra.tipo}`;

                // Define endereço padrão se vazio
                const enderecoFinal = obra.endereco && obra.endereco.trim() !== "" ? obra.endereco : "Endereço não informado";

                await prisma.obras.create({
                    data: {
                        nome: obra.nome,
                        endereco: enderecoFinal, // Endereço é obrigatório no schema
                        status: 'em_andamento', // Status padrão
                        descricao: descricao
                    }
                });
                console.log(`  ✅ Criada: ${obra.nome}`);
                count++;
            } else {
                console.log(`  ℹ️  Já existe: ${obra.nome}`);
            }
        } catch (e) {
            console.warn(`  💥 Erro ao criar ${obra.nome}: ${e.message}`);
        }
    }

    console.log(`\n🎉 Importação concluída! ${count} novas obras adicionadas.`);
}

main()
    .catch((e) => {
        console.error('❌ Erro no script:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
