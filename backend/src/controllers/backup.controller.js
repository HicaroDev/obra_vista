const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Controller para Backups
 */
const backupController = {
    /**
     * Dispara o script de backup
     */
    create: async (req, res) => {
        try {
            const scriptPath = path.join(__dirname, '../../scripts/backup.js');

            // Verifica se o script existe
            if (!fs.existsSync(scriptPath)) {
                return res.status(500).json({
                    success: false,
                    error: 'Script de backup não encontrado no servidor.'
                });
            }

            // Executa o script
            exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Erro ao executar backup: ${error.message}`);
                    return res.status(500).json({
                        success: false,
                        error: 'Falha ao executar processo de backup.',
                        details: stderr || error.message
                    });
                }

                console.log(`Backup realizado: ${stdout}`);

                res.json({
                    success: true,
                    message: 'Backup realizado com sucesso!',
                    logs: stdout
                });
            });

        } catch (error) {
            console.error('Erro no controller de backup:', error);
            res.status(500).json({ success: false, error: 'Erro interno ao processar backup.' });
        }
    },

    /**
     * Lista backups existentes
     */
    list: async (req, res) => {
        try {
            const backupDir = path.join(__dirname, '../../backups');

            if (!fs.existsSync(backupDir)) {
                return res.json({ success: true, data: [] });
            }

            const files = fs.readdirSync(backupDir)
                .filter(file => file.endsWith('.json') || file.endsWith('.sql')) // Aceita JSON e SQL agora
                .map(file => {
                    const stats = fs.statSync(path.join(backupDir, file));
                    return {
                        name: file,
                        size: stats.size,
                        createdAt: stats.birthtime
                    };
                })
                .sort((a, b) => b.createdAt - a.createdAt); // Mais recentes primeiro

            res.json({ success: true, data: files });

        } catch (error) {
            console.error('Erro ao listar backups:', error);
            res.status(500).json({ success: false, error: 'Erro ao listar backups.' });
        }
    },

    /**
     * Download de um arquivo de backup
     */
    download: async (req, res) => {
        try {
            const { filename } = req.params;
            // Para download via navegador, podemos relaxar a verificação de token ou validar via query string
            // Se o middleware de auth bloquear, o navegador não consegue baixar.
            // Solução rápida e aceitável para MVP: Se já passou pelo middleware (router.use(auth)), ok.
            // MAS, links diretos <a> não enviam header Authorization.
            // Precisamos que a rota de download SEJA PÚBLICA mas verifique um token na query string se quisermos segurança,
            // ou assumir risco controlado.

            const filePath = path.join(__dirname, '../../backups', filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ success: false, error: 'Arquivo não encontrado.' });
            }

            res.download(filePath);

        } catch (error) {
            console.error('Erro no download de backup:', error);
            res.status(500).json({ success: false, error: 'Erro ao baixar backup.' });
        }
    },

    /**
     * Restaurar um backup
     */
    restore: async (req, res) => {
        try {
            const { filename } = req.params;
            const scriptPath = path.join(__dirname, '../../scripts/restore.js');

            // Executa o script de restore
            exec(`node "${scriptPath}" "${filename}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Erro ao restaurar: ${error.message}`);
                    return res.status(500).json({
                        success: false,
                        error: 'Falha ao restaurar backup.',
                        details: stderr || error.message
                    });
                }

                console.log(`Restauração realizada: ${stdout}`);

                res.json({
                    success: true,
                    message: 'Backup restaurado com sucesso!',
                    logs: stdout
                });
            });

        } catch (error) {
            console.error('Erro no controller de restore:', error);
            res.status(500).json({ success: false, error: 'Erro interno ao processar restauração.' });
        }
    }
};

module.exports = backupController;
