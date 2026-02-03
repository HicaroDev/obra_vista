import { useState, useEffect } from 'react';
import {
  PiBuildings as Building2,
  PiUsers as Users,
  PiLayout as LayoutDashboard,
  PiTrendUp as TrendingUp,
  PiClock as Clock, // Aliased to fix ReferenceError
  PiSpinner,
  PiCheckCircle,
  PiWarningCircle,
  PiPlayCircle
} from 'react-icons/pi';
import { dashboardApi } from '../lib/api';
import { cn } from '../utils/cn';

interface DashboardStats {
  obrasAtivas: number;
  equipes: number;
  tarefasPendentes: number;
  progressoGeral: number;
}

interface Atividade {
  id: number;
  titulo: string;
  status: string;
  updatedAt: string;
  obraNome: string;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    obrasAtivas: 0,
    equipes: 0,
    tarefasPendentes: 0,
    progressoGeral: 0,
  });
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, atividadesResponse] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getAtividades(),
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      if (atividadesResponse.success) {
        setAtividades(atividadesResponse.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      name: 'Obras Ativas',
      value: stats.obrasAtivas.toString(),
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/30',
      iconColor: 'text-blue-50',
    },
    {
      name: 'Equipes',
      value: stats.equipes.toString(),
      icon: Users,
      color: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/30',
      iconColor: 'text-emerald-50',
    },
    {
      name: 'Tarefas Pendentes',
      value: stats.tarefasPendentes.toString(),
      icon: LayoutDashboard,
      color: 'from-orange-500 to-orange-600',
      shadow: 'shadow-orange-500/30',
      iconColor: 'text-orange-50',
    },
    {
      name: 'Progresso Geral',
      value: `${stats.progressoGeral}%`,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-500/30',
      iconColor: 'text-purple-50',
    },
  ];

  const getStatusConfig = (status: string) => {
    const configs = {
      a_fazer: {
        text: 'A Fazer',
        icon: PiWarningCircle,
        style: 'bg-gray-100/50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'
      },
      em_progresso: {
        text: 'Em Progresso',
        icon: PiPlayCircle,
        style: 'bg-blue-100/50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
      },
      concluido: {
        text: 'Concluído',
        icon: PiCheckCircle,
        style: 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
      },
    };
    return configs[status as keyof typeof configs] || configs.a_fazer;
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const updated = new Date(date);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours} h`;
    return `há ${diffDays} d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <PiSpinner className="animate-spin text-primary mx-auto opacity-50" size={48} />
          <p className="mt-4 text-muted-foreground font-medium animate-pulse">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Visão geral das suas obras e métricas
        </p>
      </div>

      {/* Stats Grid - Glassmorphism Cards with DEEP DARK Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="group relative overflow-hidden bg-white/60 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:bg-white/80 dark:hover:bg-zinc-800/80"
            >
              <div className="flex flex-col gap-4 relative z-10">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110",
                  stat.color,
                  stat.shadow
                )}>
                  <Icon size={24} className={stat.iconColor} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{stat.value}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1 dark:text-zinc-400">{stat.name}</p>
                </div>
              </div>

              {/* Decorative background glow */}
              <div className={cn(
                "absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-2xl transition-all group-hover:opacity-20 bg-gradient-to-br",
                stat.color
              )} />
            </div>
          );
        })}
      </div>

      {/* Recent Activity - Large Glass Card with DEEP DARK Theme */}
      <div className="relative overflow-hidden bg-white/60 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-2xl p-6 sm:p-8 shadow-xl">
        {/* Aurora Effect inside card */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full pointer-events-none" />

        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center gap-2 relative z-10">
          <Clock className="text-primary" />
          Atividades Recentes
        </h2>

        {atividades.length === 0 ? (
          <div className="text-center py-12 relative z-10">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="text-muted-foreground/50" size={32} />
            </div>
            <p className="text-muted-foreground">Nenhuma atividade recente registrada</p>
          </div>
        ) : (
          <div className="space-y-4 relative z-10">
            {atividades.map((atividade, index) => {
              const status = getStatusConfig(atividade.status);
              const StatusIcon = status.icon;

              return (
                <div
                  key={atividade.id}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-white/20 hover:bg-white/50 dark:hover:bg-white/5 hover:shadow-sm transition-all duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-2 h-12 rounded-full bg-gray-200 dark:bg-gray-700 group-hover:bg-primary transition-colors" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-gray-800",
                        "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-300"
                      )}>
                        {atividade.titulo?.charAt(0).toUpperCase() || '?'}
                      </span>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {atividade.titulo || 'Sem título'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="hidden sm:inline">Na obra:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{atividade.obraNome}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span>{getTimeAgo(atividade.updatedAt)}</span>
                    </div>
                  </div>

                  <div className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm border border-transparent",
                    status.style
                  )}>
                    <StatusIcon size={14} />
                    <span className="hidden sm:inline">{status.text}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
