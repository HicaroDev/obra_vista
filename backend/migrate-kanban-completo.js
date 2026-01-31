const { Client } = require('pg');
require('dotenv').config();

async function migrarKanbanCompleto() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🚀 Iniciando migração do Kanban Completo...\n');

        await client.connect();
        console.log('✅ Conectado ao banco de dados!\n');

        // 1. Atualizar tabela atribuicoes
        console.log('📝 Atualizando tabela atribuicoes...');
        await client.query(`
            ALTER TABLE atribuicoes 
            ADD COLUMN IF NOT EXISTS tipo_atribuicao VARCHAR(20) DEFAULT 'equipe',
            ADD COLUMN IF NOT EXISTS prestador_id INTEGER,
            ADD COLUMN IF NOT EXISTS dias_semana JSONB
        `);

        await client.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'atribuicoes_prestador_id_fkey'
                ) THEN
                    ALTER TABLE atribuicoes 
                    ADD CONSTRAINT atribuicoes_prestador_id_fkey 
                    FOREIGN KEY (prestador_id) REFERENCES prestadores(id);
                END IF;
            END $$;
        `);
        console.log('✅ Tabela atribuicoes atualizada!\n');

        // 2. Criar tabela tarefa_checklists
        console.log('📝 Criando tabela tarefa_checklists...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS tarefa_checklists (
                id SERIAL PRIMARY KEY,
                atribuicao_id INTEGER NOT NULL,
                titulo VARCHAR(255) NOT NULL,
                concluido BOOLEAN DEFAULT FALSE,
                ordem INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (atribuicao_id) REFERENCES atribuicoes(id) ON DELETE CASCADE
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tarefa_checklists_atribuicao 
            ON tarefa_checklists(atribuicao_id)
        `);
        console.log('✅ Tabela tarefa_checklists criada!\n');

        // 3. Criar tabela tarefa_anexos
        console.log('📝 Criando tabela tarefa_anexos...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS tarefa_anexos (
                id SERIAL PRIMARY KEY,
                atribuicao_id INTEGER NOT NULL,
                nome_arquivo VARCHAR(255) NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                url VARCHAR(500) NOT NULL,
                tamanho INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (atribuicao_id) REFERENCES atribuicoes(id) ON DELETE CASCADE
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tarefa_anexos_atribuicao 
            ON tarefa_anexos(atribuicao_id)
        `);
        console.log('✅ Tabela tarefa_anexos criada!\n');

        // 4. Criar tabela etiquetas
        console.log('📝 Criando tabela etiquetas...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS etiquetas (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL UNIQUE,
                cor VARCHAR(7) DEFAULT '#3B82F6',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabela etiquetas criada!\n');

        // 5. Criar tabela tarefa_etiquetas
        console.log('📝 Criando tabela tarefa_etiquetas...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS tarefa_etiquetas (
                id SERIAL PRIMARY KEY,
                atribuicao_id INTEGER NOT NULL,
                etiqueta_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (atribuicao_id) REFERENCES atribuicoes(id) ON DELETE CASCADE,
                FOREIGN KEY (etiqueta_id) REFERENCES etiquetas(id) ON DELETE CASCADE,
                UNIQUE (atribuicao_id, etiqueta_id)
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tarefa_etiquetas_atribuicao 
            ON tarefa_etiquetas(atribuicao_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tarefa_etiquetas_etiqueta 
            ON tarefa_etiquetas(etiqueta_id)
        `);
        console.log('✅ Tabela tarefa_etiquetas criada!\n');

        // 6. Criar tabela tarefa_compras
        console.log('📝 Criando tabela tarefa_compras...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS tarefa_compras (
                id SERIAL PRIMARY KEY,
                atribuicao_id INTEGER NOT NULL,
                material VARCHAR(255) NOT NULL,
                quantidade DECIMAL(10,2) NOT NULL,
                unidade VARCHAR(50),
                status VARCHAR(50) DEFAULT 'pendente',
                observacoes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (atribuicao_id) REFERENCES atribuicoes(id) ON DELETE CASCADE
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tarefa_compras_atribuicao 
            ON tarefa_compras(atribuicao_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tarefa_compras_status 
            ON tarefa_compras(status)
        `);
        console.log('✅ Tabela tarefa_compras criada!\n');

        // 7. Criar tabela tarefa_ocorrencias
        console.log('📝 Criando tabela tarefa_ocorrencias...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS tarefa_ocorrencias (
                id SERIAL PRIMARY KEY,
                atribuicao_id INTEGER NOT NULL,
                titulo VARCHAR(255) NOT NULL,
                descricao TEXT,
                gravidade VARCHAR(50) DEFAULT 'media',
                status VARCHAR(50) DEFAULT 'aberto',
                usuario_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (atribuicao_id) REFERENCES atribuicoes(id) ON DELETE CASCADE,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tarefa_ocorrencias_atribuicao 
            ON tarefa_ocorrencias(atribuicao_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tarefa_ocorrencias_status 
            ON tarefa_ocorrencias(status)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_tarefa_ocorrencias_gravidade 
            ON tarefa_ocorrencias(gravidade)
        `);
        console.log('✅ Tabela tarefa_ocorrencias criada!\n');

        // 8. Criar tabela ocorrencia_anexos
        console.log('📝 Criando tabela ocorrencia_anexos...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS ocorrencia_anexos (
                id SERIAL PRIMARY KEY,
                ocorrencia_id INTEGER NOT NULL,
                nome_arquivo VARCHAR(255) NOT NULL,
                url VARCHAR(500) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ocorrencia_id) REFERENCES tarefa_ocorrencias(id) ON DELETE CASCADE
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_ocorrencia_anexos_ocorrencia 
            ON ocorrencia_anexos(ocorrencia_id)
        `);
        console.log('✅ Tabela ocorrencia_anexos criada!\n');

        // 9. Inserir etiquetas padrão
        console.log('📝 Inserindo etiquetas padrão...');
        const etiquetasPadrao = [
            ['Urgente', '#EF4444'],
            ['Material', '#F59E0B'],
            ['Mão de Obra', '#3B82F6'],
            ['Elétrica', '#FBBF24'],
            ['Hidráulica', '#06B6D4'],
            ['Estrutural', '#6B7280'],
            ['Acabamento', '#8B5CF6'],
            ['Documentação', '#10B981']
        ];

        for (const [nome, cor] of etiquetasPadrao) {
            await client.query(
                'INSERT INTO etiquetas (nome, cor) VALUES ($1, $2) ON CONFLICT (nome) DO NOTHING',
                [nome, cor]
            );
        }
        console.log('✅ Etiquetas padrão inseridas!\n');

        console.log('🎉 Migração concluída com sucesso!');
        console.log('\n📊 Resumo:');
        console.log('  ✅ Tabela atribuicoes atualizada');
        console.log('  ✅ 7 novas tabelas criadas:');
        console.log('     • tarefa_checklists');
        console.log('     • tarefa_anexos');
        console.log('     • etiquetas');
        console.log('     • tarefa_etiquetas');
        console.log('     • tarefa_compras');
        console.log('     • tarefa_ocorrencias');
        console.log('     • ocorrencia_anexos');
        console.log('  ✅ 8 etiquetas padrão inseridas');
        console.log('\n🚀 Sistema Kanban Completo está pronto!');

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
migrarKanbanCompleto()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
