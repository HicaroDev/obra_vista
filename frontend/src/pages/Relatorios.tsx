import { PiFileText as FileText, PiWrench as Construction } from 'react-icons/pi';

export function Relatorios() {
    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="text-center max-w-md">
                <div className="mb-6">
                    <Construction className="mx-auto text-yellow-500 mb-4" size={80} />
                    <FileText className="mx-auto text-primary" size={64} />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-4">
                    Relatórios
                </h1>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500 rounded-xl p-6 mb-6">
                    <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
                        🚧 Em Construção
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                        Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
                    </p>
                </div>
                <div className="text-muted-foreground space-y-2">
                    <p className="text-sm">
                        <strong>Em breve você poderá:</strong>
                    </p>
                    <ul className="text-sm text-left list-disc list-inside space-y-1">
                        <li>Gerar relatórios de obras</li>
                        <li>Visualizar dashboards analíticos</li>
                        <li>Exportar dados em PDF e Excel</li>
                        <li>Acompanhar métricas de desempenho</li>
                        <li>Análise de custos e prazos</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
