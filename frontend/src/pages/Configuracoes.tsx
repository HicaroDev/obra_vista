import { useState, useEffect } from 'react';
import { PiDatabase, PiDownloadSimple, PiCheckCircle, PiWarning, PiClock, PiWarningCircle, PiGear, PiArrowCounterClockwise } from 'react-icons/pi';
import { backupApi } from '../lib/api';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/authStore';

export function Configuracoes() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [backups, setBackups] = useState<any[]>([]);
    const [lastBackup, setLastBackup] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);


    // Carregar lista de backups
    useEffect(() => {
        loadBackups();
    }, []);

    const loadBackups = async () => {
        try {
            const response = await backupApi.list();
            if (response.success && response.data) {
                setBackups(response.data);
                if (response.data.length > 0) {
                    setLastBackup(new Date(response.data[0].createdAt).toLocaleString());
                }
            }
        } catch (error) {
            console.error('Erro ao carregar backups:', error);
        }
    };

    const handleBackup = async () => {
        if (!confirm('Deseja iniciar o backup do banco de dados agora?')) return;

        setLoading(true);
        setFeedback(null);
        try {
            const response = await backupApi.create();
            if (response.success) {
                setFeedback({ type: 'success', message: 'Backup realizado com sucesso!' });
                loadBackups();
            } else {
                setFeedback({ type: 'error', message: response.error || 'Erro ao realizar backup' });
            }
        } catch (error: any) {
            console.error('Erro no backup:', error);
            alert('❌ Erro ao realizar backup: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (filename: string) => {
        if (!confirm(`⚠️ ATENÇÃO: Restaurar o backup substituirá TODOS os dados atuais do sistema pelos dados do backup.\n\nTem certeza absoluta que deseja continuar?`)) {
            return;
        }

        setLoading(true);
        setFeedback(null);
        try {
            const response = await backupApi.restore(filename);
            if (response.success) {
                setFeedback({ type: 'success', message: 'Sistema restaurado com sucesso! A página será recarregada.' });
                setTimeout(() => window.location.reload(), 2000);
            } else {
                setFeedback({ type: 'error', message: response.error || 'Erro ao restaurar backup' });
            }
        } catch (error) {
            setFeedback({ type: 'error', message: 'Erro de conexão ao restaurar' });
        } finally {
            setLoading(false);
        }
    };

    // Permissão apenas para Admin
    if (user?.tipo !== 'admin') {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
                <PiWarning className="text-yellow-500 mb-4" size={48} />
                <h2 className="text-xl font-bold text-gray-800">Acesso Restrito</h2>
                <p className="text-gray-500 mt-2">Apenas administradores podem acessar as configurações do sistema.</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1200px] mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
            <p className="text-muted-foreground mb-8">Gerencie backups e preferências do sistema</p>

            {feedback && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {feedback.type === 'success' ? <PiCheckCircle size={24} /> : <PiWarningCircle size={24} />}
                    <p className="font-medium">{feedback.message}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Card de Backup */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <PiDatabase size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Backup do Banco de Dados</h2>
                                <p className="text-sm text-gray-500">Salve uma cópia segura dos seus dados</p>
                            </div>
                        </div>
                        {lastBackup && (
                            <div className="text-right">
                                <span className="text-xs text-gray-400 font-medium block">Último backup:</span>
                                <span className="text-sm text-gray-700 font-medium flex items-center gap-1">
                                    <PiClock size={14} /> {lastBackup}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            O backup gera um arquivo JSON contendo todos os dados do sistema.
                            Este arquivo pode ser usado para restaurar todo o sistema se necessário.
                            O arquivo é salvo no servidor na pasta <code>/backups</code>.
                        </p>
                    </div>

                    <button
                        onClick={handleBackup}
                        disabled={loading}
                        className={cn(
                            "w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2",
                            loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25"
                        )}
                    >
                        {loading ? (
                            <>Processando Backup...</>
                        ) : (
                            <>
                                <PiDownloadSimple size={20} />
                                Fazer Backup Agora
                            </>
                        )}
                    </button>

                    {/* Histórico Recente */}
                    {backups.length > 0 && (
                        <div className="mt-8 border-t border-gray-100 pt-6">
                            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Histórico Recente</h3>
                            <div className="space-y-3">
                                {backups.slice(0, 5).map((backup, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100/50 hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${index === 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                <PiCheckCircle size={20} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{backup.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {(backup.size / 1024 / 1024).toFixed(2)} MB • {new Date(backup.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={backupApi.getDownloadUrl(backup.name)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Download"
                                            >
                                                <PiDownloadSimple size={20} />
                                            </a>
                                            <button
                                                onClick={() => handleRestore(backup.name)}
                                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                title="Restaurar este backup"
                                            >
                                                <PiArrowCounterClockwise size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Outras Configurações (Placeholder) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm opacity-60 pointer-events-none grayscale">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                                AI
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Configurações de IA</h3>
                                <p className="text-sm text-gray-500">Em breve: Ajuste o comportamento do assistente</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
