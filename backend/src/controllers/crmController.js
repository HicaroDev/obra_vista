const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== LEADS ====================

exports.getLeads = async (req, res, next) => {
    try {
        const leads = await prisma.crmLead.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { deals: true }
                }
            }
        });
        res.json({ success: true, data: leads });
    } catch (error) {
        next(error);
    }
};

exports.getLeadById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const lead = await prisma.crmLead.findUnique({
            where: { id: parseInt(id) },
            include: {
                deals: true,
                obras: true
            }
        });

        if (!lead) return res.status(404).json({ success: false, message: 'Lead não encontrado' });

        res.json({ success: true, data: lead });
    } catch (error) {
        next(error);
    }
};

exports.createLead = async (req, res, next) => {
    try {
        const data = req.body;
        const lead = await prisma.crmLead.create({ data });
        res.status(201).json({ success: true, data: lead });
    } catch (error) {
        next(error);
    }
};

exports.updateLead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const lead = await prisma.crmLead.update({
            where: { id: parseInt(id) },
            data
        });
        res.json({ success: true, data: lead });
    } catch (error) {
        next(error);
    }
};

exports.deleteLead = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.crmLead.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Lead excluído com sucesso' });
    } catch (error) {
        next(error);
    }
};

// ==================== DEALS (OPORTUNIDADES) ====================

exports.getDeals = async (req, res, next) => {
    try {
        const deals = await prisma.crmDeal.findMany({
            include: {
                lead: true,
                obra: true,
                propostas: {
                    orderBy: { versao: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json({ success: true, data: deals });
    } catch (error) {
        next(error);
    }
};

exports.getDealById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deal = await prisma.crmDeal.findUnique({
            where: { id: parseInt(id) },
            include: {
                lead: true,
                obra: {
                    include: {
                        orcamento_detalhado: true
                    }
                },
                propostas: true,
                interacoes: {
                    include: {
                        usuario: {
                            select: { nome: true, avatar_url: true }
                        }
                    },
                    orderBy: { data: 'desc' }
                },
                vistoria: true
            }
        });

        if (!deal) return res.status(404).json({ success: false, message: 'Deal não encontrado' });

        res.json({ success: true, data: deal });
    } catch (error) {
        next(error);
    }
};

exports.createDeal = async (req, res, next) => {
    try {
        const { leadId, titulo, valorEstimado, estagio, obraId } = req.body;

        const deal = await prisma.crmDeal.create({
            data: {
                leadId: parseInt(leadId),
                titulo,
                valorEstimado: parseFloat(valorEstimado) || 0,
                estagio,
                obraId: obraId ? parseInt(obraId) : undefined
            }
        });

        // Registrar Interação de Criação
        await prisma.crmInteracao.create({
            data: {
                dealId: deal.id,
                tipo: 'sistema',
                descricao: `Negócio criado no estágio "${estagio || 'prospeccao'}"`,
                usuarioId: req.user.id,
                data: new Date()
            }
        });

        res.status(201).json({ success: true, data: deal });
    } catch (error) {
        next(error);
    }
};

exports.updateDeal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Remove campos que não devem ser atualizados diretamente ou trata conversões
        if (data.leadId) data.leadId = parseInt(data.leadId);

        const deal = await prisma.crmDeal.update({
            where: { id: parseInt(id) },
            data
        });

        res.json({ success: true, data: deal });
    } catch (error) {
        next(error);
    }
};

exports.updateDealStage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { estagio } = req.body;

        const dealAntigo = await prisma.crmDeal.findUnique({ where: { id: parseInt(id) } });

        const deal = await prisma.crmDeal.update({
            where: { id: parseInt(id) },
            data: { estagio }
        });

        // Registrar Interação de Mudança de Estágio
        if (dealAntigo && dealAntigo.estagio !== estagio) {
            await prisma.crmInteracao.create({
                data: {
                    dealId: parseInt(id),
                    tipo: 'sistema',
                    descricao: `Estágio alterado de "${dealAntigo.estagio}" para "${estagio}"`,
                    usuarioId: req.user.id,
                    data: new Date()
                }
            });
        }

        res.json({ success: true, data: deal });
    } catch (error) {
        next(error);
    }
};

// ... imports existing ...
const fs = require('fs');
const path = require('path');
const PdfPrinter = require('pdfmake/js/Printer').default;

// Definir fontes para o PDFMake (usando as do node_modules)
const fonts = {
    Roboto: {
        normal: path.join(__dirname, '../../node_modules/pdfmake/fonts/Roboto/Roboto-Regular.ttf'),
        bold: path.join(__dirname, '../../node_modules/pdfmake/fonts/Roboto/Roboto-Medium.ttf'),
        italics: path.join(__dirname, '../../node_modules/pdfmake/fonts/Roboto/Roboto-Italic.ttf'),
        bolditalics: path.join(__dirname, '../../node_modules/pdfmake/fonts/Roboto/Roboto-MediumItalic.ttf')
    }
};

const printer = new PdfPrinter(fonts);

exports.deleteDeal = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.crmDeal.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Deal excluído com sucesso' });
    } catch (error) {
        next(error);
    }
};

// ==================== PROPOSTAS ====================

exports.createProposta = async (req, res, next) => {
    try {
        const { dealId, valor, observacoes, validade, multiplier = 1 } = req.body;

        // 1. Buscar dados do Deal, Lead e Orçamento
        const deal = await prisma.crmDeal.findUnique({
            where: { id: parseInt(dealId) },
            include: {
                lead: true,
                obra: {
                    include: {
                        orcamento_detalhado: {
                            include: {
                                itens: {
                                    orderBy: { id: 'asc' } // Manter ordem
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!deal) return res.status(404).json({ success: false, message: 'Deal não encontrado' });

        // Determinar versão
        const lastProposta = await prisma.proposta.findFirst({
            where: { dealId: parseInt(dealId) },
            orderBy: { versao: 'desc' }
        });
        const versao = (lastProposta?.versao || 0) + 1;

        // 2. Montar Definição do PDF
        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 120, 40, 60], // Reservar espaço para header fixo
            background: function (currentPage) {
                // Marca d'água ou fundo sutil em todas as páginas
                return {
                    text: 'OBRA VISTA - PROPOSTA COMERCIAL',
                    color: '#f8fafc',
                    fontSize: 40,
                    bold: true,
                    alignment: 'center',
                    margin: [0, 300, 0, 0],
                    opacity: 0.05
                };
            },
            header: function (currentPage) {
                return {
                    margin: [40, 30, 40, 0],
                    columns: [
                        {
                            stack: [
                                { text: 'OBRA VISTA', fontSize: 18, bold: true, color: '#2563EB' },
                                { text: 'Soluções em Engenharia e Construção', fontSize: 8, color: '#64748b', margin: [0, 2, 0, 0] }
                            ]
                        },
                        {
                            stack: [
                                { text: `PROPOSTA COMERCIAL #${dealId}`, alignment: 'right', fontSize: 10, bold: true, color: '#1e293b' },
                                { text: `Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, alignment: 'right', fontSize: 8, color: '#64748b' },
                                { text: `Página ${currentPage}`, alignment: 'right', fontSize: 8, color: '#64748b' }
                            ]
                        }
                    ]
                };
            },
            footer: function (currentPage, pageCount) {
                return {
                    margin: [40, 0, 40, 0],
                    stack: [
                        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#e2e8f0' }] },
                        {
                            columns: [
                                { text: 'Obra Vista - Automação de Canteiros', fontSize: 8, color: '#94a3b8', margin: [0, 10, 0, 0] },
                                { text: `www.obravista.com.br`, alignment: 'right', fontSize: 8, color: '#94a3b8', margin: [0, 10, 0, 0] }
                            ]
                        }
                    ]
                };
            },
            content: [
                // 2. Seção de Clientes
                {
                    columns: [
                        {
                            stack: [
                                { text: 'CLIENTE / CONTRATANTE', fontSize: 8, bold: true, color: '#2563EB', margin: [0, 0, 0, 5] },
                                { text: deal.lead.nome, fontSize: 14, bold: true, color: '#1e293b' },
                                { text: deal.lead.empresa || '', fontSize: 10, color: '#475569' },
                                { text: deal.lead.email || 'N/A', fontSize: 10, color: '#475569' },
                                { text: deal.lead.telefone || 'N/A', fontSize: 10, color: '#475569' },
                            ]
                        },
                        {
                            stack: [
                                { text: 'LOCAL DA OBRA / PROJETO', fontSize: 8, bold: true, color: '#2563EB', margin: [0, 0, 0, 5], alignment: 'right' },
                                { text: deal.obra?.nome || 'Não definida', fontSize: 11, bold: true, color: '#1e293b', alignment: 'right' },
                                { text: deal.obra?.endereco || 'Logradouro a confirmar', fontSize: 10, color: '#475569', alignment: 'right' },
                            ]
                        }
                    ],
                    margin: [0, 0, 0, 30]
                },

                // 3. Resumo Executivo
                {
                    stack: [
                        { text: 'OBJETO DA PROPOSTA', fontSize: 10, bold: true, color: '#1e293b', margin: [0, 0, 0, 5] },
                        { text: deal.titulo, fontSize: 11, color: '#475569', leadingIndent: 0 },
                        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 0.5, lineColor: '#f1f5f9' }] }
                    ],
                    margin: [0, 0, 0, 30]
                },

                // 4. Seção de Escopo (Tabela)
                { text: 'DETALHAMENTO DO ESCOPO', fontSize: 12, bold: true, color: '#1e293b', margin: [0, 0, 0, 15] },
            ],
            styles: {
                tableHeader: {
                    bold: true,
                    fontSize: 10,
                    color: '#ffffff',
                    fillColor: '#2563EB',
                    alignment: 'center',
                    margin: [0, 5, 0, 5]
                },
                tableCell: {
                    fontSize: 10,
                    margin: [0, 5, 0, 5]
                }
            },
            defaultStyle: {
                font: 'Roboto'
            }
        };

        // Gerar Tabela de Itens (Pega o primeiro orçamento não-template da obra)
        const orcamento = deal.obra?.orcamento_detalhado?.find(o => !o.isTemplate) || deal.obra?.orcamento_detalhado?.[0];

        if (orcamento?.itens?.length > 0) {
            const tableBody = [
                [
                    { text: 'ITEM / DESCRIÇÃO', style: 'tableHeader', alignment: 'left' },
                    { text: 'UNID.', style: 'tableHeader' },
                    { text: 'QUANT.', style: 'tableHeader' },
                    { text: 'PREÇO UNIT.', style: 'tableHeader', alignment: 'right' },
                    { text: 'TOTAL (R$)', style: 'tableHeader', alignment: 'right' }
                ]
            ];

            orcamento.itens.forEach((item, index) => {
                if (parseFloat(item.valorTotal) > 0 || item.tipo === 'etapa') {
                    const isEtapa = item.tipo === 'etapa';

                    // Aplicar multiplicador (margem) se existir
                    const unitPrice = parseFloat(item.valorUnitario || 0) * multiplier;
                    const totalPrice = parseFloat(item.valorTotal || 0) * multiplier;

                    tableBody.push([
                        { text: item.descricao, style: 'tableCell', bold: isEtapa, fillColor: isEtapa ? '#f8fafc' : null },
                        { text: isEtapa ? '' : (item.unidade || 'UN'), style: 'tableCell', alignment: 'center', fillColor: isEtapa ? '#f8fafc' : null },
                        { text: isEtapa ? '' : parseFloat(item.quantidade || 0).toLocaleString('pt-BR'), style: 'tableCell', alignment: 'center', fillColor: isEtapa ? '#f8fafc' : null },
                        { text: isEtapa ? '' : unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), style: 'tableCell', alignment: 'right', fillColor: isEtapa ? '#f8fafc' : null },
                        { text: totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), style: 'tableCell', alignment: 'right', bold: isEtapa, fillColor: isEtapa ? '#f8fafc' : null }
                    ]);
                }
            });

            docDefinition.content.push({
                table: {
                    headerRows: 1,
                    widths: ['*', 40, 50, 70, 80],
                    body: tableBody
                },
                layout: {
                    hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
                    vLineWidth: () => 0,
                    hLineColor: (i) => (i === 0) ? '#2563EB' : '#e2e8f0',
                    paddingLeft: () => 8,
                    paddingRight: () => 8,
                }
            });

            // Card de Resumo Financeiro
            docDefinition.content.push({
                unbreakable: true,
                margin: [0, 30, 0, 0],
                table: {
                    widths: ['*', 150],
                    body: [
                        [
                            { text: '', border: [false, false, false, false] },
                            {
                                stack: [
                                    {
                                        columns: [
                                            { text: 'VALOR TOTAL:', bold: true, fontSize: 12 },
                                            { text: parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), bold: true, fontSize: 12, alignment: 'right', color: '#2563EB' }
                                        ]
                                    }
                                ],
                                fillColor: '#f1f5f9',
                                padding: [10, 10, 10, 10]
                            }
                        ]
                    ]
                },
                layout: 'noBorders'
            });
        }

        // Observações e Assinaturas
        if (observacoes) {
            docDefinition.content.push(
                { text: 'OBSERVAÇÕES E CONDIÇÕES', fontSize: 10, bold: true, margin: [0, 30, 0, 10] },
                { text: observacoes, fontSize: 10, color: '#475569', margin: [0, 0, 0, 40] }
            );
        }

        // Espaço para assinatura
        docDefinition.content.push({
            margin: [0, 50, 0, 0],
            columns: [
                {
                    width: 200,
                    stack: [
                        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 0.5 }] },
                        { text: 'DE ACORDO DO CLIENTE', fontSize: 8, alignment: 'center', margin: [0, 5, 0, 0] },
                        { text: deal.lead.nome, fontSize: 9, bold: true, alignment: 'center' }
                    ]
                },
                { width: '*', text: '' },
                {
                    width: 200,
                    stack: [
                        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 0.5 }] },
                        { text: 'OBRA VISTA - RESPONSÁVEL', fontSize: 8, alignment: 'center', margin: [0, 5, 0, 0] },
                        { text: 'EMPRESA CONTRATADA', fontSize: 9, bold: true, alignment: 'center' }
                    ]
                }
            ]
        });

        // 3. Gerar PDF
        const pdfDoc = await printer.createPdfKitDocument(docDefinition);

        // Garantir diretório
        const uploadsDir = path.join(__dirname, '../../uploads/propostas');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileName = `proposta_${dealId}_v${versao}_${Date.now()}.pdf`;
        const filePath = path.join(uploadsDir, fileName);
        const writeStream = fs.createWriteStream(filePath);

        pdfDoc.pipe(writeStream);
        pdfDoc.end();

        // Aguardar escrita
        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        const fileUrl = `/uploads/propostas/${fileName}`;

        // 4. Salvar registro no banco
        const proposta = await prisma.proposta.create({
            data: {
                dealId: parseInt(dealId),
                versao,
                valor: parseFloat(valor),
                validade: validade ? new Date(validade) : null,
                observacoes,
                arquivoUrl: fileUrl,
                status: 'gerada'
            }
        });

        res.status(201).json({ success: true, data: proposta });

    } catch (error) {
        console.error('Erro ao gerar proposta:', error);
        next(error);
    }
};

exports.getPropostasByDeal = async (req, res, next) => {
    try {
        const { dealId } = req.params;
        const propostas = await prisma.proposta.findMany({
            where: { dealId: parseInt(dealId) },
            orderBy: { versao: 'desc' }
        });
        res.json({ success: true, data: propostas });
    } catch (error) {
        next(error);
    }
};

exports.winDeal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { dataInicio } = req.body;

        const deal = await prisma.crmDeal.findUnique({
            where: { id: parseInt(id) },
            include: { lead: true, obra: true }
        });

        if (!deal) return res.status(404).json({ success: false, message: 'Deal não encontrado' });

        let obraId = deal.obraId;

        // Se já existe uma obra vinculada, apenas atualizamos o status dela
        if (obraId) {
            await prisma.obras.update({
                where: { id: obraId },
                data: {
                    status: 'em_andamento',
                    dataInicio: dataInicio ? new Date(dataInicio) : deal.obra.dataInicio || new Date()
                }
            });
        } else {
            // Se não existe, criamos uma nova obra baseada no Lead e no Deal
            const novaObra = await prisma.obras.create({
                data: {
                    nome: deal.titulo || deal.lead.nome,
                    endereco: deal.lead.endereco || 'A configurar',
                    descricao: `Obra gerada a partir do Deal #${deal.id}`,
                    status: 'em_andamento',
                    dataInicio: dataInicio ? new Date(dataInicio) : new Date(),
                    leadId: deal.leadId,
                    orcamento: deal.valorEstimado
                }
            });
            obraId = novaObra.id;
        }

        // Atualizar o Deal para Ganho e vincular a Obra (se não estava)
        const dealAtualizado = await prisma.crmDeal.update({
            where: { id: parseInt(id) },
            data: {
                estagio: 'ganho',
                obraId: obraId
            }
        });

        // Atualizar o Lead para 'cliente' e garantir o vínculo com a obra
        await prisma.crmLead.update({
            where: { id: deal.leadId },
            data: { status: 'cliente' }
        });

        // 4. Registrar Interação de Sistema
        await prisma.crmInteracao.create({
            data: {
                dealId: parseInt(id),
                tipo: 'sistema',
                descricao: `Negócio fechado com sucesso! Projeto convertido em obra ativa.`,
                usuarioId: req.user.id, // Assumindo que authMiddleware injeta req.user
                data: new Date()
            }
        });

        res.json({
            success: true,
            message: 'Parabéns pela venda! O negócio agora é uma obra ativa.',
            data: dealAtualizado
        });

    } catch (error) {
        console.error('Erro ao fechar negócio:', error);
        next(error);
    }
};

exports.loseDeal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        const deal = await prisma.crmDeal.findUnique({
            where: { id: parseInt(id) }
        });

        if (!deal) return res.status(404).json({ success: false, message: 'Deal não encontrado' });

        const dealAtualizado = await prisma.crmDeal.update({
            where: { id: parseInt(id) },
            data: { estagio: 'perdido' }
        });

        // Registrar Interação
        await prisma.crmInteracao.create({
            data: {
                dealId: parseInt(id),
                tipo: 'sistema',
                descricao: `Negócio marcado como PERDIDO. Motivo: ${motivo || 'Não informado'}`,
                usuarioId: req.user.id,
                data: new Date()
            }
        });

        res.json({ success: true, message: 'Negócio marcado como perdido.', data: dealAtualizado });
    } catch (error) {
        next(error);
    }
};

// ==================== INTERAÇÕES ====================

exports.getInteracoesByDeal = async (req, res, next) => {
    try {
        const { dealId } = req.params;
        const interacoes = await prisma.crmInteracao.findMany({
            where: { dealId: parseInt(dealId) },
            include: {
                usuario: {
                    select: { nome: true, avatar_url: true }
                }
            },
            orderBy: { data: 'desc' }
        });
        res.json({ success: true, data: interacoes });
    } catch (error) {
        next(error);
    }
};

exports.createInteracao = async (req, res, next) => {
    try {
        const { dealId, tipo, descricao, data } = req.body;

        const interacao = await prisma.crmInteracao.create({
            data: {
                dealId: parseInt(dealId),
                tipo,
                descricao,
                usuarioId: req.user.id,
                data: data ? new Date(data) : new Date()
            },
            include: {
                usuario: {
                    select: { nome: true, avatar_url: true }
                }
            }
        });

        res.status(201).json({ success: true, data: interacao });
    } catch (error) {
        next(error);
    }
};

// ==================== VISTORIA / CHECKLIST ====================

exports.getPerguntas = async (req, res, next) => {
    try {
        const perguntas = await prisma.crmPergunta.findMany({
            orderBy: [{ categoria: 'asc' }, { ordem: 'asc' }]
        });
        res.json({ success: true, data: perguntas });
    } catch (error) {
        next(error);
    }
};

exports.getVistoriaByDeal = async (req, res, next) => {
    try {
        const { dealId } = req.params;
        const vistoria = await prisma.crmVistoria.findUnique({
            where: { dealId: parseInt(dealId) }
        });
        res.json({ success: true, data: vistoria });
    } catch (error) {
        next(error);
    }
};

exports.createOrUpdateVistoria = async (req, res, next) => {
    try {
        const { dealId, respostas } = req.body;

        const vistoria = await prisma.crmVistoria.upsert({
            where: { dealId: parseInt(dealId) },
            update: { respostas },
            create: {
                dealId: parseInt(dealId),
                respostas
            }
        });

        // Registrar Interação de Sistema
        if (req.user) {
            await prisma.crmInteracao.create({
                data: {
                    dealId: parseInt(dealId),
                    tipo: 'sistema',
                    descricao: `Vistoria técnica atualizada/preenchida.`,
                    usuarioId: req.user.id,
                    data: new Date()
                }
            });
        }

        res.json({ success: true, data: vistoria });
    } catch (error) {
        next(error);
    }
};

