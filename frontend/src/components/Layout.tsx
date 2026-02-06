import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useModuleStore } from '../store/moduleStore';
import {
  PiList, PiX, PiSignOut,
  PiHouse, PiUsersThree, PiBuildings, PiKanban, PiCalendarCheck,
  PiBriefcase, PiFileText, PiUserGear, PiGear,
  PiCaretDown, PiCaretRight, PiFolderPlus, PiPackage, PiScales, PiWrench,
  PiSquaresFour, PiCurrencyDollar, PiHandshake, PiArrowLeft, PiArrowsLeftRight, PiHardHat,
  PiChartLine, PiTag, PiIdentificationCard
} from 'react-icons/pi';
import { useAuthStore } from '../store/authStore';
import { canAccessPage, hasModuleAccess } from '../lib/permissions';
import { cn } from '../utils/cn';
import { SYSTEM_MODULES } from '../constants/modules';
import { useRef, useEffect } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const { user, logout } = useAuthStore();
  const { activeModule, setModule } = useModuleStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [openMenus, setOpenMenus] = useState<string[]>(['Cadastros']);
  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const moduleMenuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moduleMenuRef.current && !moduleMenuRef.current.contains(event.target as Node)) {
        setShowModuleMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [moduleMenuRef]);

  // Redirecionamento de segurança: Se o módulo ativo não for acessível, sair dele
  useEffect(() => {
    // Só verifica se tiver usuário e módulo ativo
    if (user && activeModule && !hasModuleAccess(activeModule, user)) {
      // Tentar achar o primeiro módulo acessível
      const firstAccessible = SYSTEM_MODULES.find(m => hasModuleAccess(m.id, user));
      if (firstAccessible) {
        setModule(firstAccessible.id as any);
        // Redireciona para evitar rota 404/vazia
        navigate('/');
      } else {
        setModule(null);
        navigate('/modules');
      }
    }
  }, [activeModule, user, setModule, navigate]);

  interface NavigationItem {
    name: string;
    href?: string;
    icon: any;
    page: string;
    children?: NavigationItem[];
  }

  // ... (interface NavigationItem)

  // Definição dos Menus por Módulo (Sincronizado com SYSTEM_MODULES)
  const menusByModule: Record<string, NavigationItem[]> = {
    gestao: [
      { name: 'Dashboard', href: '/', icon: PiSquaresFour, page: 'dashboard' },
      { name: 'Relatórios', href: '/relatorios', icon: PiChartLine, page: 'relatorios' },
      { name: 'Usuários', href: '/usuarios', icon: PiIdentificationCard, page: 'usuarios' },
      { name: 'Prestadores', href: '/prestadores', icon: PiBriefcase, page: 'prestadores' },
      { name: 'Configurações', href: '/configuracoes', icon: PiGear, page: 'configuracoes' },
      { name: 'Especialidades', href: '/especialidades', icon: PiTag, page: 'tipos_prestadores' },
    ],
    operacional: [
      { name: 'Obras', href: '/obras', icon: PiBuildings, page: 'obras' },
      { name: 'Kanban', href: '/kanban', icon: PiKanban, page: 'kanban' },
      { name: 'Equipes', href: '/equipes', icon: PiUsersThree, page: 'equipes' },
      { name: 'Ferramentas', href: '/ferramentas', icon: PiWrench, page: 'ferramentas' },
      { name: 'Ponto', href: '/frequencia', icon: PiCalendarCheck, page: 'kanban' },
    ],
    financeiro: [
      { name: 'Lançamentos', href: '/financeiro', icon: PiCurrencyDollar, page: 'financeiro' },
      { name: 'Produtos', href: '/produtos', icon: PiPackage, page: 'produtos' },
      { name: 'Unidades', href: '/unidades', icon: PiScales, page: 'unidades' },
    ],
    crm: [
      { name: 'Pipeline', href: '/crm', icon: PiHandshake, page: 'crm' },
    ],
    // Fallback
  };

  // Seleciona menu com fallback
  const currentMenu = menusByModule[activeModule || 'gestao'] || menusByModule['operacional'] || [];

  const filterNavigation = (items: NavigationItem[]): NavigationItem[] => {
    // ... (Lógica de filtro de permissão existente)
    return items.reduce((acc: NavigationItem[], item) => {
      if (item.children) {
        const filteredChildren = filterNavigation(item.children);
        if (filteredChildren.length > 0) {
          acc.push({ ...item, children: filteredChildren });
        }
      } else {
        if (canAccessPage(item.page, user)) {
          acc.push(item);
        }
      }
      return acc;
    }, []);
  };

  const navigation = filterNavigation(currentMenu);


  const toggleMenu = (name: string) => {
    setOpenMenus(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };



  return (
    <div className="min-h-screen relative overflow-hidden bg-background selection:bg-primary/20">
      {/* Background - Light Mode Clean */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-gray-50">
        <div className="absolute top-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[500px] w-[500px] rounded-full bg-purple-400/20 blur-[120px]" />
      </div>

      {/* Topbar Light */}
      <header className="fixed top-0 left-0 right-0 h-16 z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm" />

        <div className="relative h-full px-4 lg:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-black/5 rounded-xl transition-colors lg:hidden text-foreground"
            >
              {sidebarOpen ? <PiX size={22} /> : <PiList size={22} />}
            </button>
            <Link to="/modules" className="flex items-center gap-3 group">
              <div className="relative">
                <img src="/logo.png" alt="Obra Vista" className="relative h-9 w-auto object-contain drop-shadow-sm" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
                Obra Vista
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-3">

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 pl-3 pr-1 py-1 bg-white/50 backdrop-blur-md rounded-full border border-white/20 shadow-sm">
                <span className="text-sm font-medium hidden md:block pl-1 text-gray-700">
                  {user?.nome}
                </span>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {user?.nome?.charAt(0).toUpperCase()}
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2.5 hover:bg-red-50 hover:text-red-500 text-muted-foreground rounded-xl transition-all"
                title="Sair"
              >
                <PiSignOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Light Mode Only */}
      {/* Sidebar - Light Mode Only */}
      {location.pathname !== '/modules' && (
        <aside
          className={cn(
            'fixed z-[60] lg:z-40 transition-all duration-300 ease-out',
            'inset-y-0 left-0 w-[280px] lg:w-64',
            'lg:top-20 lg:bottom-4 lg:left-4 lg:rounded-2xl',
            'bg-white/80 backdrop-blur-2xl',
            'border border-white/20 shadow-2xl lg:shadow-xl',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-[80px] xl:w-64'
          )}
        >
          <div className="lg:hidden flex items-center justify-between p-5 border-b border-border/50">
            <span className="font-bold text-lg text-primary">Menu ({activeModule || 'OPERATIONAL'})</span>
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-black/5 rounded-xl text-foreground">
              <PiX size={20} />
            </button>
          </div>

          {/* Botão para trocar de módulo (Estilo Premium) */}
          {/* Botão para trocar de módulo (Estilo Premium) */}
          <div className="mx-3 mt-4 mb-2 relative" ref={moduleMenuRef}>
            <button
              onClick={() => setShowModuleMenu(!showModuleMenu)}
              className="w-full group relative overflow-hidden bg-white hover:bg-gray-50 border border-gray-100 shadow-sm hover:shadow-md rounded-2xl p-3 transition-all duration-300 text-left"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 pl-0.5">Módulo Atual</span>
                <div className="flex items-center text-[10px] font-bold text-blue-600 opacity-60 group-hover:opacity-100 transition-opacity bg-blue-50 px-2 py-0.5 rounded-full">
                  TROCAR <PiCaretRight className={`ml-1 transition-transform ${showModuleMenu ? 'rotate-90' : ''}`} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm text-white transition-transform group-hover:scale-110",
                  activeModule === 'financeiro' ? 'bg-emerald-500' :
                    activeModule === 'sistema' ? 'bg-slate-600' :
                      activeModule === 'operacional' ? 'bg-blue-600' :
                        'bg-violet-500'
                )}>
                  {/* Renderiza o ícone do módulo ativo ou default */}
                  {(() => {
                    const mod = SYSTEM_MODULES.find(m => m.id === (activeModule || 'gestao'));
                    const Icon = mod?.icon || PiSquaresFour;
                    return <Icon />;
                  })()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 leading-tight">
                    {SYSTEM_MODULES.find(m => m.id === (activeModule || 'gestao'))?.label || 'Módulo'}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px]">
                    {(SYSTEM_MODULES.find(m => m.id === (activeModule || 'gestao'))?.description || '').split(' ')[0] + '...'}
                  </p>
                </div>
              </div>
            </button>

            {/* EXPANDED MENU (Lateral à direita do botão) */}
            {showModuleMenu && (
              <div className="absolute left-full top-0 ml-4 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[100] animate-in fade-in slide-in-from-left-4 duration-200">
                <div className="px-3 py-2 border-b border-gray-100 mb-2">
                  <h4 className="font-bold text-gray-800">Módulos Disponíveis</h4>
                  <p className="text-xs text-gray-400">Selecione para navegar</p>
                </div>
                <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                  {SYSTEM_MODULES.filter(m => hasModuleAccess(m.id, user)).map((modulo) => (
                    <button
                      key={modulo.id}
                      onClick={() => {
                        setModule(modulo.id as any);
                        setShowModuleMenu(false);
                        // Se necessário, navegar para a home do módulo
                        // Mas geralmente mudar o estado já atualiza o menu
                      }}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group",
                        activeModule === modulo.id
                          ? "bg-blue-50 border border-blue-100"
                          : "hover:bg-gray-50 border border-transparent"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        activeModule === modulo.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm"
                      )}>
                        <modulo.icon size={18} />
                      </div>
                      <div>
                        <div className={cn(
                          "font-bold text-sm",
                          activeModule === modulo.id ? "text-blue-700" : "text-gray-700"
                        )}>
                          {modulo.label}
                        </div>
                        <div className="text-[10px] text-gray-400 leading-tight mt-0.5">
                          {modulo.description}
                        </div>
                      </div>
                      {activeModule === modulo.id && (
                        <div className="ml-auto flex h-full items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <nav className="p-3 lg:p-4 space-y-1.5 overflow-y-auto h-full scrollbar-hide py-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              if (item.children) {
                const isOpen = openMenus.includes(item.name);
                const isActiveParent = item.children.some(child => child.href === location.pathname);

                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-3 lg:py-2.5 rounded-xl transition-all duration-200 group',
                        'font-medium text-sm',
                        isActiveParent
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-black/5 hover:text-gray-900'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          isActiveParent ? "bg-white text-blue-600" : ""
                        )}>
                          <Icon size={20} />
                        </div>
                        <span>{item.name}</span>
                      </div>
                      {isOpen ? <PiCaretDown size={14} className="opacity-70" /> : <PiCaretRight size={14} className="opacity-70" />}
                    </button>

                    {isOpen && (
                      <div className="pl-4 space-y-1 relative ml-3">
                        <div className="absolute left-0 top-2 bottom-2 w-px bg-gray-200" />
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildActive = location.pathname === child.href;
                          return (
                            <Link
                              key={child.name}
                              to={child.href!}
                              onClick={() => {
                                if (window.innerWidth < 1024) setSidebarOpen(false);
                              }}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ml-2',
                                isChildActive
                                  ? 'text-blue-600 font-semibold'
                                  : 'text-gray-500 hover:text-gray-900'
                              )}
                            >
                              <ChildIcon size={16} className={isChildActive ? "text-blue-600" : "opacity-70"} />
                              <span>{child.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href!}
                  onClick={() => {
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden',
                    'font-medium text-sm',
                    isActive
                      ? 'bg-gradient-to-r from-primary to-blue-600 text-[#0e0000] shadow-lg shadow-blue-500/25' // Blue Gradient + Black Text (#0e0000)
                      : 'text-gray-600 hover:bg-black/5 hover:text-gray-900'
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg transition-colors z-10",
                    isActive ? "bg-white/20 text-[#0e0000]" : "" // Icon Dark
                  )}>
                    <Icon size={20} />
                  </div>
                  <span className="z-10 font-bold">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer User Info */}
          <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-gray-50 border border-border">
            <p className="text-xs text-muted-foreground text-center">
              Perfil: <span className="font-bold text-primary">{user?.tipo}</span>
            </p>
            <p className="text-[10px] text-gray-400 text-center mt-1">
              v2.0
            </p>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main
        className={cn(
          'pt-20 px-4 pb-8 transition-all duration-300 min-h-screen',
          location.pathname !== '/modules' ? 'lg:ml-[280px] lg:mr-4' : 'mx-auto max-w-7xl'
        )}
      >
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
