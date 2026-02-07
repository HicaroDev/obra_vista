const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const XLSX = require('xlsx');

// Importar orçamento via upload de Excel
exports.importarOrcamento = async (req, res, next) => {
    try {
        const { obraId } = req.params;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });

        // Vamos ler as abas principais
        const abaOrcamento = workbook.Sheets['Orçamento Detalhado'];
        const abaComposicoes = workbook.Sheets['Composições Analíticas'];

        if (!abaOrcamento) {
            return res.status(400).json({ success: false, message: 'Aba "Orçamento Detalhado" não encontrada no arquivo.' });
        }

        // --- Passo 1: Limpar orçamento existente para esta obra ---
        // Isso deleta em cascata itens e insumos graças ao onDelete: Cascade no schema
        await prisma.orcamento.deleteMany({ where: { obraId: parseInt(obraId) } });

        // --- Passo 2: Criar novo orçamento ---
        const novoOrcamento = await prisma.orcamento.create({
            data: {
                obraId: parseInt(obraId),
                nome: `Orçamento Importado em ${new Date().toLocaleDateString()}`,
                dataBase: new Date()
            }
        });

        // --- Passo 3: Processar "Composições Analíticas" (Alimentar Banco de Dados) ---
        if (abaComposicoes) {
            console.log('Processando aba Composições Analíticas...');
            const dadosComposicoes = XLSX.utils.sheet_to_json(abaComposicoes, { header: 1, defval: '' });
            // Assumindo cabeçalho na linha 1 (índice 0)
            const linhasComposicoes = dadosComposicoes.slice(1);

            // Cache para evitar buscas repetitivas no banco (para performance)
            // Em produção real, isso poderia usar muito memória se o banco for gigante, 
            // mas para MVP e "Mini-ERP" de obra funciona bem.
            const mapas = {
                insumos: new Map(), // codigo -> id
                composicoes: new Map() // codigo -> id
            };

            // 3.1 - Identificar e Criar Insumos/Composições "Pai"
            for (const row of linhasComposicoes) {
                // Estrutura esperada (Baseada em SINAPI/ORSE comum):
                // A: Codigo Composição | B: Descrição Comp | C: Unidade Comp
                // D: Tipo Insumo | E: Codigo Insumo | F: Descricao Insumo | G: Unidade Insumo
                // H: Coeficiente | I: Preço Unitario

                const codComp = row[0]?.toString().trim();
                const descComp = row[1]?.toString().trim();
                const undComp = row[2]?.toString().trim();

                const tipoItem = row[3]?.toString().trim().toLowerCase(); // Material, Mão de Obra, etc
                const codInsumo = row[4]?.toString().trim();
                const descInsumo = row[5]?.toString().trim();
                const undInsumo = row[6]?.toString().trim();
                const coeficiente = parseFloat(row[7]) || 0;
                const custoUnitario = parseFloat(row[8]) || 0;

                if (!codComp || !codInsumo) continue;

                // --- 3.1.a: Upsert Composicao Mestre (Pai) ---
                if (!mapas.composicoes.has(codComp)) {
                    // Tenta achar no banco ou cria
                    let compMaster = await prisma.composicaoMaster.findUnique({ where: { codigo: codComp } });
                    if (!compMaster) {
                        compMaster = await prisma.composicaoMaster.create({
                            data: {
                                codigo: codComp,
                                descricao: descComp || `Composição ${codComp}`,
                                unidade: undComp || 'UN',
                                tipo: 'proprio'
                            }
                        });
                    }
                    mapas.composicoes.set(codComp, compMaster.id);
                }

                // --- 3.1.b: Upsert Insumo Mestre (Filho) ---
                if (!mapas.insumos.has(codInsumo)) {
                    let insumoMaster = await prisma.insumoMaster.findUnique({ where: { codigo: codInsumo } });

                    if (!insumoMaster) {
                        // Determinar tipo
                        let tipoInsumoDB = 'material';
                        if (tipoItem.includes('mão') || tipoItem.includes('mao') || tipoItem.includes('servente') || tipoItem.includes('pedreiro')) {
                            tipoInsumoDB = 'mao_de_obra';
                        } else if (tipoItem.includes('equipamento')) {
                            tipoInsumoDB = 'equipamento';
                        } else if (tipoItem.includes('serviço') || tipoItem.includes('composicao')) {
                            // Se o insumo for OUTRA composição, tratar recursividade (avançado, por enquanto trata como serviço)
                            tipoInsumoDB = 'servico';
                        }

                        insumoMaster = await prisma.insumoMaster.create({
                            data: {
                                codigo: codInsumo,
                                descricao: descInsumo || `Insumo ${codInsumo}`,
                                unidade: undInsumo || 'UN',
                                tipo: tipoInsumoDB,
                                custoPadrao: custoUnitario
                            }
                        });
                    }
                    mapas.insumos.set(codInsumo, insumoMaster.id);
                }

                // --- 3.1.c: Criar Link (ComposicaoItemMaster) ---
                const compId = mapas.composicoes.get(codComp);
                const insumoId = mapas.insumos.get(codInsumo);

                // Verifica se já existe o vínculo para não duplicar
                const itemExistente = await prisma.composicaoItemMaster.findFirst({
                    where: {
                        composicaoId: compId,
                        insumoId: insumoId
                    }
                });

                if (!itemExistente) {
                    await prisma.composicaoItemMaster.create({
                        data: {
                            composicaoId: compId,
                            insumoId: insumoId,
                            coeficiente: coeficiente
                        }
                    });
                } else {
                    // Se existe, atualiza coeficiente se mudou (opcional, aqui mantemos o existente ou atualizamos)
                    // await prisma.composicaoItemMaster.update(...)
                }
            }
            console.log('Aba Composições processada com sucesso.');
        }

        // --- Passo 4: Processar "Orçamento Detalhado" (Criar Proposta) ---
        const dadosOrcamento = XLSX.utils.sheet_to_json(abaOrcamento, { header: 1, defval: '' });
        const linhasOrcamento = dadosOrcamento.slice(1); // Ignorar cabeçalho

        let somaCustoDiretoTotal = 0;
        let somaPrecoVendaTotal = 0;

        for (const row of linhasOrcamento) {
            const wbs = row[0]?.toString();
            const etapa = row[1]?.toString();
            const codigo = row[2]?.toString();
            const descricao = row[3]?.toString() || etapa;
            const unidade = row[4]?.toString();
            const qtd = parseFloat(row[5]) || 0;
            const custoUnitario = parseFloat(row[9]) || 0; // Coluna J
            const precoTotalItem = parseFloat(row[11]) || 0; // Coluna L

            if (!descricao) continue;

            const tipo = codigo ? 'composicao' : 'etapa';
            const custoTotalItem = custoUnitario * qtd;

            if (tipo === 'composicao') {
                somaCustoDiretoTotal += custoTotalItem;
                somaPrecoVendaTotal += precoTotalItem;
            }

            await prisma.orcamentoItem.create({
                data: {
                    orcamentoId: novoOrcamento.id,
                    wbs: wbs,
                    codigo: codigo,
                    descricao: descricao,
                    unidade: unidade,
                    quantidade: qtd,
                    tipo: tipo,
                    valorUnitario: custoUnitario,
                    valorTotal: precoTotalItem,
                    custoMaterial: parseFloat(row[6]) || 0,
                    custoMaoDeObra: parseFloat(row[7]) || 0,
                    custoEquipamento: parseFloat(row[8]) || 0,
                }
            });
        }

        // --- Passo 5: Calcular e Atualizar BDI Global ---
        let bdiGlobal = 0;
        if (somaCustoDiretoTotal > 0 && somaPrecoVendaTotal > 0) {
            bdiGlobal = ((somaPrecoVendaTotal / somaCustoDiretoTotal) - 1) * 100;
        }

        await prisma.orcamento.update({
            where: { id: novoOrcamento.id },
            data: {
                valorTotal: somaPrecoVendaTotal,
                bdi: bdiGlobal
            }
        });

        res.json({
            success: true,
            message: 'Importação Inteligente concluída! Orçamento gerado e Banco de Composições atualizado.',
            orcamentoId: novoOrcamento.id,
            resumo: {
                totalCusto: somaCustoDiretoTotal,
                totalVenda: somaPrecoVendaTotal,
                bdiCalculado: bdiGlobal.toFixed(2) + '%'
            }
        });
    } catch (error) {
        console.error('Erro importacao:', error);
        next(error);
    }
};

// Obter orçamento completo
exports.getOrcamento = async (req, res, next) => {
    try {
        const { obraId } = req.params;

        const orcamento = await prisma.orcamento.findFirst({
            where: {
                obraId: parseInt(obraId),
                isTemplate: false
            },
            include: {
                itens: {
                    include: {
                        insumos: true
                    },
                    orderBy: {
                        id: 'asc' // Tentar manter ordem de inserção (que seguiu o excel)
                    }
                }
            }
        });

        if (!orcamento) {
            return res.status(404).json({ success: false, message: 'Orçamento não encontrado.' });
        }

        res.json({ success: true, data: orcamento });
    } catch (error) {
        next(error);
    }
};

// Salvar um orçamento atual como template
exports.saveAsTemplate = async (req, res, next) => {
    try {
        const { orcamentoId, nome } = req.body;

        // 1. Buscar o orçamento original com todos os itens
        const original = await prisma.orcamento.findUnique({
            where: { id: parseInt(orcamentoId) },
            include: {
                itens: {
                    include: {
                        insumos: true
                    }
                }
            }
        });

        if (!original) return res.status(404).json({ success: false, message: 'Orçamento original não encontrado' });

        // 2. Criar novo orçamento como template (sem obraId)
        const template = await prisma.orcamento.create({
            data: {
                nome: nome || `Template: ${original.nome}`,
                valorTotal: original.valorTotal,
                bdi: original.bdi,
                isTemplate: true
            }
        });

        // 3. Clonar itens
        for (const item of original.itens) {
            const novoItem = await prisma.orcamentoItem.create({
                data: {
                    orcamentoId: template.id,
                    wbs: item.wbs,
                    codigo: item.codigo,
                    descricao: item.descricao,
                    unidade: item.unidade,
                    quantidade: item.quantidade,
                    tipo: item.tipo,
                    valorUnitario: item.valorUnitario,
                    valorTotal: item.valorTotal,
                    custoMaterial: item.custoMaterial,
                    custoMaoDeObra: item.custoMaoDeObra,
                    custoEquipamento: item.custoEquipamento,
                }
            });

            // Clonar insumos do item
            if (item.insumos && item.insumos.length > 0) {
                await prisma.composicaoInsumo.createMany({
                    data: item.insumos.map(ins => ({
                        orcamentoItemId: novoItem.id,
                        tipo: ins.tipo,
                        codigo: ins.codigo,
                        descricao: ins.descricao,
                        unidade: ins.unidade,
                        quantidade: ins.quantidade,
                        custoUnitario: ins.custoUnitario,
                        custoTotal: ins.custoTotal
                    }))
                });
            }
        }

        res.json({ success: true, message: 'Orçamento salvo como template!', data: template });
    } catch (error) {
        next(error);
    }
};

// Listar templates disponíveis
exports.getTemplates = async (req, res, next) => {
    try {
        const templates = await prisma.orcamento.findMany({
            where: { isTemplate: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: templates });
    } catch (error) {
        next(error);
    }
};

// Criar um orçamento para uma obra a partir de um template
exports.createFromTemplate = async (req, res, next) => {
    try {
        const { obraId, templateId } = req.body;

        // 1. Buscar o template com todos os itens
        const template = await prisma.orcamento.findUnique({
            where: { id: parseInt(templateId) },
            include: {
                itens: {
                    include: {
                        insumos: true
                    }
                }
            }
        });

        if (!template) return res.status(404).json({ success: false, message: 'Template não encontrado' });

        // 2. Criar novo orçamento para a obra
        const novoOrcamento = await prisma.orcamento.create({
            data: {
                obraId: parseInt(obraId),
                nome: `Orçamento: ${template.nome}`,
                valorTotal: template.valorTotal,
                bdi: template.bdi,
                isTemplate: false
            }
        });

        // 3. Clonar itens
        for (const item of template.itens) {
            const novoItem = await prisma.orcamentoItem.create({
                data: {
                    orcamentoId: novoOrcamento.id,
                    wbs: item.wbs,
                    codigo: item.codigo,
                    descricao: item.descricao,
                    unidade: item.unidade,
                    quantidade: item.quantidade,
                    tipo: item.tipo,
                    valorUnitario: item.valorUnitario,
                    valorTotal: item.valorTotal,
                    custoMaterial: item.custoMaterial,
                    custoMaoDeObra: item.custoMaoDeObra,
                    custoEquipamento: item.custoEquipamento,
                }
            });

            // Clonar insumos do item
            if (item.insumos && item.insumos.length > 0) {
                await prisma.composicaoInsumo.createMany({
                    data: item.insumos.map(ins => ({
                        orcamentoItemId: novoItem.id,
                        tipo: ins.tipo,
                        codigo: ins.codigo,
                        descricao: ins.descricao,
                        unidade: ins.unidade,
                        quantidade: ins.quantidade,
                        custoUnitario: ins.custoUnitario,
                        custoTotal: ins.custoTotal
                    }))
                });
            }
        }

        res.json({ success: true, message: 'Orçamento gerado a partir do template!', data: novoOrcamento });
    } catch (error) {
        next(error);
    }
};
