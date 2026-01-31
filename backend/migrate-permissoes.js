const { Client } = require('pg');
require('dotenv').config();

async function migrarSistemaPermissoes() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🚀 Iniciando migração do Sistema de Permissões...\n');

        await client.connect();
        console.log('✅ Conectado ao banco de dados!\n');

        // 1. Atualizar tabela usuarios
        console.log('📝 Atualizando tabela usuarios...');
        await client.query(`
            ALTER TABLE usuarios 
            ADD COLUMN IF NOT EXISTS telefone VARCHAR(50),
            ADD COLUMN IF NOT EXISTS cargo VARCHAR(100),
            ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
            ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMP
        `);
        console.log('✅ Tabela usuarios atualizada!\n');

        // 2. Criar tabela de roles (papéis)
        console.log('📝 Criando tabela roles...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(50) NOT NULL UNIQUE,
                descricao TEXT,
                nivel INTEGER NOT NULL, -- 1=Admin, 2=Gerente, 3=Supervisor, 4=Usuário
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabela roles criada!\n');

        // 3. Criar tabela de permissões
        console.log('📝 Criando tabela permissoes...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS permissoes (
                id SERIAL PRIMARY KEY,
                modulo VARCHAR(50) NOT NULL, -- 'obras', 'prestadores', 'equipes', 'kanban', 'relatorios', 'usuarios'
                acao VARCHAR(50) NOT NULL, -- 'criar', 'ler', 'editar', 'excluir', 'gerenciar'
                descricao TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (modulo, acao)
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_permissoes_modulo 
            ON permissoes(modulo)
        `);
        console.log('✅ Tabela permissoes criada!\n');

        // 4. Criar tabela de relacionamento role_permissoes
        console.log('📝 Criando tabela role_permissoes...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS role_permissoes (
                id SERIAL PRIMARY KEY,
                role_id INTEGER NOT NULL,
                permissao_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                FOREIGN KEY (permissao_id) REFERENCES permissoes(id) ON DELETE CASCADE,
                UNIQUE (role_id, permissao_id)
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_role_permissoes_role 
            ON role_permissoes(role_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_role_permissoes_permissao 
            ON role_permissoes(permissao_id)
        `);
        console.log('✅ Tabela role_permissoes criada!\n');

        // 5. Criar tabela de relacionamento usuario_roles
        console.log('📝 Criando tabela usuario_roles...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS usuario_roles (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER NOT NULL,
                role_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                UNIQUE (usuario_id, role_id)
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_usuario_roles_usuario 
            ON usuario_roles(usuario_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_usuario_roles_role 
            ON usuario_roles(role_id)
        `);
        console.log('✅ Tabela usuario_roles criada!\n');

        // 6. Inserir roles padrão
        console.log('📝 Inserindo roles padrão...');
        const rolesPadrao = [
            ['Administrador', 'Acesso total ao sistema', 1],
            ['Gerente', 'Gerencia obras e equipes', 2],
            ['Supervisor', 'Supervisiona tarefas e prestadores', 3],
            ['Usuário', 'Acesso básico de leitura', 4]
        ];

        for (const [nome, descricao, nivel] of rolesPadrao) {
            await client.query(
                'INSERT INTO roles (nome, descricao, nivel) VALUES ($1, $2, $3) ON CONFLICT (nome) DO NOTHING',
                [nome, descricao, nivel]
            );
        }
        console.log('✅ Roles padrão inseridos!\n');

        // 7. Inserir permissões padrão
        console.log('📝 Inserindo permissões padrão...');
        const modulos = ['obras', 'prestadores', 'equipes', 'kanban', 'relatorios', 'usuarios'];
        const acoes = [
            ['criar', 'Criar novos registros'],
            ['ler', 'Visualizar registros'],
            ['editar', 'Editar registros existentes'],
            ['excluir', 'Excluir registros'],
            ['gerenciar', 'Gerenciar configurações e permissões']
        ];

        for (const modulo of modulos) {
            for (const [acao, descricao] of acoes) {
                await client.query(
                    'INSERT INTO permissoes (modulo, acao, descricao) VALUES ($1, $2, $3) ON CONFLICT (modulo, acao) DO NOTHING',
                    [modulo, acao, `${descricao} em ${modulo}`]
                );
            }
        }
        console.log('✅ Permissões padrão inseridas!\n');

        // 8. Atribuir permissões aos roles
        console.log('📝 Atribuindo permissões aos roles...');

        // Administrador - TODAS as permissões
        await client.query(`
            INSERT INTO role_permissoes (role_id, permissao_id)
            SELECT 
                (SELECT id FROM roles WHERE nome = 'Administrador'),
                id
            FROM permissoes
            ON CONFLICT DO NOTHING
        `);

        // Gerente - Todas exceto gerenciar usuários
        await client.query(`
            INSERT INTO role_permissoes (role_id, permissao_id)
            SELECT 
                (SELECT id FROM roles WHERE nome = 'Gerente'),
                id
            FROM permissoes
            WHERE NOT (modulo = 'usuarios' AND acao IN ('criar', 'excluir', 'gerenciar'))
            ON CONFLICT DO NOTHING
        `);

        // Supervisor - Ler tudo, editar obras/kanban/prestadores
        await client.query(`
            INSERT INTO role_permissoes (role_id, permissao_id)
            SELECT 
                (SELECT id FROM roles WHERE nome = 'Supervisor'),
                id
            FROM permissoes
            WHERE acao = 'ler' 
               OR (modulo IN ('obras', 'kanban', 'prestadores') AND acao IN ('criar', 'editar'))
            ON CONFLICT DO NOTHING
        `);

        // Usuário - Apenas leitura
        await client.query(`
            INSERT INTO role_permissoes (role_id, permissao_id)
            SELECT 
                (SELECT id FROM roles WHERE nome = 'Usuário'),
                id
            FROM permissoes
            WHERE acao = 'ler'
            ON CONFLICT DO NOTHING
        `);

        console.log('✅ Permissões atribuídas aos roles!\n');

        console.log('🎉 Migração concluída com sucesso!');
        console.log('\n📊 Resumo:');
        console.log('  ✅ Tabela usuarios atualizada (telefone, cargo, avatar, último acesso)');
        console.log('  ✅ 4 novas tabelas criadas:');
        console.log('     • roles (4 papéis)');
        console.log('     • permissoes (30 permissões)');
        console.log('     • role_permissoes (relacionamentos)');
        console.log('     • usuario_roles (relacionamentos)');
        console.log('  ✅ 4 roles padrão inseridos');
        console.log('  ✅ 30 permissões inseridas');
        console.log('  ✅ Permissões atribuídas aos roles');
        console.log('\n🔐 Sistema de Permissões está pronto!');

    } catch (error) {
        console.error('❌ Erro na migração:', error.message);
        console.error(error);
        throw error;
    } finally {
        await client.end();
        console.log('\n👋 Conexão fechada.');
    }
}

// Executar migração
migrarSistemaPermissoes()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
