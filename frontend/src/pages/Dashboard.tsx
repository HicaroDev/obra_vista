import { useState, useEffect } from 'react';
import {
  PiBuildings as Building2,
  PiUsers as Users,
  PiLayout as LayoutDashboard,
  PiTrendUp as TrendingUp,
  PiClock as Clock,
  PiSpinner
} from 'react-icons/pi';
import { dashboardApi } from '../lib/api';

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
      color: 'bg-blue-500',
    },
    {
      name: 'Equipes',
      value: stats.equipes.toString(),
      icon: Users,
      color: 'bg-green-500',
    },
    {
      name: 'Tarefas Pendentes',
      value: stats.tarefasPendentes.toString(),
      icon: LayoutDashboard,
      color: 'bg-orange-500',
    },
    {
      name: 'Progresso Geral',
      value: `${stats.progressoGeral}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      a_fazer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      em_progresso: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      concluido: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return colors[status as keyof typeof colors] || colors.a_fazer;
  };

  const getStatusText = (status: string) => {
    const texts = {
      a_fazer: 'A Fazer',
      em_progresso: 'Em Progresso',
      concluido: 'Concluído',
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const updated = new Date(date);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <PiSpinner className="animate-spin text-primary mx-auto" size={48} />
          <p className="mt-4 text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-medium">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral das suas obras e equipes
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.name}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <h2 className="text-xl font-bold mb-4">Atividades Recentes</h2>

        {atividades.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto text-muted-foreground mb-2" size={48} />
            <p className="text-muted-foreground">Nenhuma atividade recente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {atividades.map((atividade) => (
              <div key={atividade.id} className="flex items-start gap-4 p-4 bg-accent rounded-lg hover:bg-accent/80 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                  {atividade.titulo.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{atividade.titulo}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(atividade.status)}`}>
                      {getStatusText(atividade.status)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {atividade.obraNome} • {getTimeAgo(atividade.updatedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
