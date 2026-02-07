const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Limpar dados existentes (cuidado em produção!)
  // Limpar dados existentes (DESATIVADO PARA PROTEÇÃO DE DADOS)
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('🗑️  Limpando dados existentes...');
  //   await prisma.logs.deleteMany();
  //   await prisma.atribuicoes.deleteMany();
  //   await prisma.equipes_Membros.deleteMany();
  //   await prisma.equipes.deleteMany();
  //   await prisma.obras.deleteMany();
  //   await prisma.prestadores.deleteMany();
  //   await prisma.usuarios.deleteMany();
  //   console.log('✅ Dados limpos!\n');
  // }

  // ==================== USUÁRIOS ====================
  console.log('👤 Criando usuários...');

  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const hashedPasswordUser = await bcrypt.hash('user123', 10);

  const admin = await prisma.usuarios.create({
    data: {
      nome: 'Administrador',
      email: 'admin@obravista.com',
      senha: hashedPasswordAdmin,
      tipo: 'admin',
      ativo: true
    }
  });
  console.log(`  ✅ Admin criado: ${admin.email}`);

  const usuario1 = await prisma.usuarios.create({
    data: {
      nome: 'João Silva',
      email: 'joao@obravista.com',
      senha: hashedPasswordUser,
      tipo: 'usuario',
      ativo: true
    }
  });
  console.log(`  ✅ Usuário criado: ${usuario1.email}`);

  const usuario2 = await prisma.usuarios.create({
    data: {
      nome: 'Maria Santos',
      email: 'maria@obravista.com',
      senha: hashedPasswordUser,
      tipo: 'usuario',
      ativo: true
    }
  });
  console.log(`  ✅ Usuário criado: ${usuario2.email}\n`);
  // ==================== ESPECIALIDADES ====================
  console.log('🛠️ Criando especialidades...');

  const especialidadesLista = [
    'Pedreiro', 'Servente', 'Eletricista', 'Encanador', 'Pintor',
    'Carpinteiro', 'Mestre de Obras', 'Engenheiro Civil', 'Arquiteto',
    'Gesseiro', 'Serralheiro', 'Vidraceiro', 'Azulejista'
  ];

  for (const esp of especialidadesLista) {
    await prisma.especialidades.upsert({
      where: { nome: esp },
      update: {},
      create: { nome: esp }
    });
  }
  console.log('  ✅ Especialidades padrão criadas\n');

  console.log('  ✅ Especialidades padrão criadas\n');

  // ==================== UNIDADES ====================
  console.log('📏 Criando unidades...');
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
    { nome: 'Rolo', sigla: 'rl' }
  ];

  for (const item of UNIDADES) {
    await prisma.unidades.upsert({
      where: { sigla: item.sigla },
      update: {},
      create: item
    });
  }
  console.log('  ✅ Unidades padrão criadas\n');

  // ==================== PRODUTOS ====================
  console.log('🧱 Criando produtos (materiais básicos)...');
  const PRODUTOS = [
    { nome: 'Cimento CP-II', unidade: 'sc' },
    { nome: 'Areia Média', unidade: 'm³' },
    { nome: 'Pedra Brita 1', unidade: 'm³' },
    { nome: 'Cal Hidratada', unidade: 'sc' },
    { nome: 'Tijolo Cerâmico 8 furos', unidade: 'un' },
    { nome: 'Tinta Acrílica Fosca Branco', unidade: 'l' },
    { nome: 'Cano PVC Soldável 25mm', unidade: 'br' },
    { nome: 'Fio Flexível 2.5mm', unidade: 'rl' }
  ];

  for (const item of PRODUTOS) {
    await prisma.produtos.upsert({
      where: { nome: item.nome },
      update: {},
      create: item
    });
  }
  console.log('  ✅ Produtos padrão criados\n');

  // ==================== PRESTADORES ====================
  console.log('👷 Criando prestadores...');

  const prestador1 = await prisma.prestadores.create({
    data: {
      nome: 'Carlos Pedreiro',
      especialidade: 'Pedreiro',
      telefone: '(11) 98765-4321',
      email: 'carlos@example.com',
      cpf: '123.456.789-01',
      ativo: true
    }
  });
  console.log(`  ✅ Prestador criado: ${prestador1.nome}`);

  const prestador2 = await prisma.prestadores.create({
    data: {
      nome: 'Ana Eletricista',
      especialidade: 'Eletricista',
      telefone: '(11) 98765-4322',
      email: 'ana@example.com',
      cpf: '123.456.789-02',
      ativo: true
    }
  });
  console.log(`  ✅ Prestador criado: ${prestador2.nome}`);

  const prestador3 = await prisma.prestadores.create({
    data: {
      nome: 'Pedro Encanador',
      especialidade: 'Encanador',
      telefone: '(11) 98765-4323',
      email: 'pedro@example.com',
      cpf: '123.456.789-03',
      ativo: true
    }
  });
  console.log(`  ✅ Prestador criado: ${prestador3.nome}\n`);

  // ==================== EQUIPES ====================
  console.log('👥 Criando equipes...');

  const equipe1 = await prisma.equipes.create({
    data: {
      nome: 'Equipe Estrutural',
      descricao: 'Responsável por fundações e estruturas',
      cor: '#3B82F6',
      ativa: true
    }
  });
  console.log(`  ✅ Equipe criada: ${equipe1.nome}`);

  const equipe2 = await prisma.equipes.create({
    data: {
      nome: 'Equipe Elétrica',
      descricao: 'Instalações elétricas e iluminação',
      cor: '#F59E0B',
      ativa: true
    }
  });
  console.log(`  ✅ Equipe criada: ${equipe2.nome}`);

  const equipe3 = await prisma.equipes.create({
    data: {
      nome: 'Equipe Hidráulica',
      descricao: 'Instalações hidráulicas e sanitárias',
      cor: '#10B981',
      ativa: true
    }
  });
  console.log(`  ✅ Equipe criada: ${equipe3.nome}\n`);

  // ==================== MEMBROS DAS EQUIPES ====================
  console.log('🔗 Adicionando membros às equipes...');

  // Equipe Estrutural
  await prisma.equipes_Membros.create({
    data: {
      equipeId: equipe1.id,
      usuarioId: usuario1.id,
      papel: 'lider'
    }
  });
  await prisma.equipes_Membros.create({
    data: {
      equipeId: equipe1.id,
      prestadorId: prestador1.id,
      papel: 'membro'
    }
  });
  console.log(`  ✅ Membros adicionados à ${equipe1.nome}`);

  // Equipe Elétrica
  await prisma.equipes_Membros.create({
    data: {
      equipeId: equipe2.id,
      usuarioId: usuario2.id,
      papel: 'lider'
    }
  });
  await prisma.equipes_Membros.create({
    data: {
      equipeId: equipe2.id,
      prestadorId: prestador2.id,
      papel: 'membro'
    }
  });
  console.log(`  ✅ Membros adicionados à ${equipe2.nome}`);

  // Equipe Hidráulica
  await prisma.equipes_Membros.create({
    data: {
      equipeId: equipe3.id,
      prestadorId: prestador3.id,
      papel: 'lider'
    }
  });
  console.log(`  ✅ Membros adicionados à ${equipe3.nome}\n`);

  // ==================== OBRAS ====================
  console.log('🏗️  Criando obras...');

  const obra1 = await prisma.obras.create({
    data: {
      nome: 'Edifício Residencial Centro',
      endereco: 'Rua Principal, 123 - Centro',
      descricao: 'Construção de prédio residencial com 10 andares',
      status: 'em_andamento',
      dataInicio: new Date('2024-01-15'),
      orcamento: 500000.00
    }
  });
  console.log(`  ✅ Obra criada: ${obra1.nome}`);

  const obra2 = await prisma.obras.create({
    data: {
      nome: 'Casa Térrea Jardim das Flores',
      endereco: 'Av. das Flores, 456 - Jardim',
      descricao: 'Construção de casa térrea com 3 quartos',
      status: 'planejamento',
      dataInicio: new Date('2024-02-01'),
      orcamento: 150000.00
    }
  });
  console.log(`  ✅ Obra criada: ${obra2.nome}\n`);

  // ==================== ATRIBUIÇÕES (KANBAN) ====================
  console.log('📋 Criando atribuições (Kanban)...');

  // Obra 1 - Atribuições
  const atrib1 = await prisma.atribuicoes.create({
    data: {
      obraId: obra1.id,
      equipeId: equipe1.id,
      titulo: 'Fundação e alicerce',
      descricao: 'Escavação e construção da fundação',
      status: 'concluido',
      prioridade: 'alta',
      ordem: 1,
      dataInicio: new Date('2024-01-15'),
      dataFim: new Date('2024-01-30')
    }
  });

  const atrib2 = await prisma.atribuicoes.create({
    data: {
      obraId: obra1.id,
      equipeId: equipe1.id,
      titulo: 'Estrutura 1º ao 5º andar',
      descricao: 'Construção da estrutura de concreto',
      status: 'em_progresso',
      prioridade: 'alta',
      ordem: 1,
      dataInicio: new Date('2024-02-01')
    }
  });

  const atrib3 = await prisma.atribuicoes.create({
    data: {
      obraId: obra1.id,
      equipeId: equipe2.id,
      titulo: 'Instalação elétrica 1º andar',
      descricao: 'Pontos de luz e tomadas',
      status: 'a_fazer',
      prioridade: 'media',
      ordem: 1
    }
  });

  const atrib4 = await prisma.atribuicoes.create({
    data: {
      obraId: obra1.id,
      equipeId: equipe3.id,
      titulo: 'Instalação hidráulica 1º andar',
      descricao: 'Tubulação de água e esgoto',
      status: 'a_fazer',
      prioridade: 'media',
      ordem: 2
    }
  });

  console.log(`  ✅ 4 atribuições criadas para ${obra1.nome}`);

  // Obra 2 - Atribuições
  const atrib5 = await prisma.atribuicoes.create({
    data: {
      obraId: obra2.id,
      equipeId: equipe1.id,
      titulo: 'Planejamento estrutural',
      descricao: 'Definir projeto estrutural da casa',
      status: 'a_fazer',
      prioridade: 'urgente',
      ordem: 1
    }
  });

  console.log(`  ✅ 1 atribuição criada para ${obra2.nome}\n`);

  // ==================== LOGS ====================
  console.log('📝 Criando logs de exemplo...');

  await prisma.logs.create({
    data: {
      usuarioId: admin.id,
      atribuicaoId: atrib1.id,
      acao: 'criou',
      entidade: 'atribuicao',
      detalhes: JSON.stringify({ titulo: atrib1.titulo, status: atrib1.status })
    }
  });

  await prisma.logs.create({
    data: {
      usuarioId: usuario1.id,
      atribuicaoId: atrib2.id,
      acao: 'moveu',
      entidade: 'atribuicao',
      detalhes: JSON.stringify({ de: 'a_fazer', para: 'em_progresso' })
    }
  });

  console.log(`  ✅ Logs criados\n`);

  console.log('  Senha: user123\n');

  // ==================== PERGUNTAS DE VISTORIA ====================
  console.log('📋 Criando perguntas de vistoria...');
  const PERGUNTAS = [
    { texto: 'Área total da reforma (m²)', tipo: 'numero', categoria: 'Medições', slug: 'm2_total', ordem: 1 },
    { texto: 'Área de pintura de paredes (m²)', tipo: 'numero', categoria: 'Medições', slug: 'm2_parede', ordem: 2 },
    { texto: 'Necessita demolição de alvenaria?', tipo: 'booleano', categoria: 'Demolição', slug: 'demolicao_alvenaria', ordem: 3 },
    { texto: 'Necessita remoção de entulho (caçambas)?', tipo: 'booleano', categoria: 'Demolição', slug: 'remocao_entulho', ordem: 4 },
    { texto: 'Tipo de piso a ser instalado', tipo: 'texto', categoria: 'Revestimentos', slug: 'tipo_piso', ordem: 5 },
    { texto: 'Troca de fiação completa?', tipo: 'booleano', categoria: 'Elétrica', slug: 'fiacao_completa', ordem: 6 },
    { texto: 'Possui elevador de serviço?', tipo: 'booleano', categoria: 'Logística', slug: 'possui_elevador', ordem: 7 },
  ];

  for (const item of PERGUNTAS) {
    await prisma.crmPergunta.upsert({
      where: { slug: item.slug },
      update: {},
      create: item
    });
  }
  console.log('  ✅ Perguntas de vistoria criadas\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
