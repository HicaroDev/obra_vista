require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function createAdminUser() {
    try {
        await client.connect();
        console.log('🔌 Conectado ao banco de dados!\n');

        // Verificar se já existe um admin
        const checkAdmin = await client.query(`
            SELECT id, nome, email FROM usuarios WHERE tipo = 'admin' LIMIT 1
        `);

        if (checkAdmin.rows.length > 0) {
            console.log('✅ Já existe um usuário admin:');
            console.log(`   Nome: ${checkAdmin.rows[0].nome}`);
            console.log(`   Email: ${checkAdmin.rows[0].email}`);
            console.log('\n💡 Se quiser criar outro admin, use a interface de usuários.\n');
            return;
        }

        console.log('📝 Criando usuário administrador padrão...\n');

        // Hash da senha
        const senhaHash = await bcrypt.hash('admin123', 10);

        // Criar usuário admin
        const result = await client.query(`
            INSERT INTO usuarios (nome, email, senha, tipo, telefone, cargo, ativo)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, nome, email, tipo
        `, [
            'Administrador',
            'admin@obravista.com',
            senhaHash,
            'admin',
            '(11) 99999-9999',
            'Administrador do Sistema',
            true
        ]);

        const adminUser = result.rows[0];
        console.log('✅ Usuário administrador criado com sucesso!\n');

        // Atribuir role de Administrador
        const roleResult = await client.query(`
            SELECT id FROM roles WHERE nome = 'Administrador' LIMIT 1
        `);

        if (roleResult.rows.length > 0) {
            await client.query(`
                INSERT INTO usuario_roles (usuario_id, role_id)
                VALUES ($1, $2)
            `, [adminUser.id, roleResult.rows[0].id]);
            console.log('✅ Role "Administrador" atribuído!\n');
        }

        console.log('🎉 Configuração concluída!\n');
        console.log('📋 Dados de acesso:');
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   📧 Email:    ${adminUser.email}`);
        console.log(`   🔑 Senha:    admin123`);
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');

    } catch (error) {
        console.error('❌ Erro ao criar usuário admin:', error);
        throw error;
    } finally {
        await client.end();
        console.log('👋 Conexão fechada.\n');
    }
}

createAdminUser()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Erro fatal:', error);
        process.exit(1);
    });
