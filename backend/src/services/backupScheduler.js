const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class BackupScheduler {
    constructor() {
        this.backupScript = path.join(__dirname, '../../scripts/backup.js');
        // Agendamento padrão: Todos os dias às 00:00, 06:00, 12:00 e 18:00 (A cada 6 horas)
        this.cronSchedule = '0 0,6,12,18 * * *';
        this.task = null;
    }

    start() {
        console.log(`⏰ Iniciando agendador de backups automático.`);
        console.log(`📅 Cronograma: ${this.cronSchedule}`);

        // Valida se o script existe
        if (!fs.existsSync(this.backupScript)) {
            console.error('❌ CRITICAL: Script de backup não encontrado em:', this.backupScript);
            return;
        }

        this.task = cron.schedule(this.cronSchedule, () => {
            console.log('🔄 Executando backup automático agendado...');
            this.runBackup();
        });

        // Executa um backup inicial ao iniciar o servidor (opcional, bom para garantir um ponto de restauração logo de cara)
        // setTimeout(() => this.runBackup(), 5000); // Aguarda 5s para não pesar no boot
    }

    runBackup() {
        exec(`node "${this.backupScript}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Erro no backup automático: ${error.message}`);
                return;
            }
            console.log(`✅ Backup automático concluído.`);
            // Opcional: Logar stdout se quiser detalhes
            // console.log(stdout); 
        });
    }

    stop() {
        if (this.task) {
            this.task.stop();
            console.log('🛑 Agendador de backups parado.');
        }
    }
}

module.exports = new BackupScheduler();
