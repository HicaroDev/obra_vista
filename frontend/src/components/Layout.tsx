import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  PiList, PiX, PiSignOut,
  PiHouse, PiUsersThree, PiBuildings, PiKanban,
  PiBriefcase, PiFileText, PiUserGear, PiGear,
  PiCaretDown, PiCaretRight, PiFolderPlus, PiPackage, PiScales
} from 'react-icons/pi';
import { useAuthStore } from '../store/authStore';
import { canAccessPage } from '../lib/permissions';
import { cn } from '../utils/cn';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const [openMenus, setOpenMenus] = useState<string[]>(['Cadastros']);

  interface NavigationItem {
    name: string;
    href?: string;
    icon: any;
    page: string;
    children?: NavigationItem[];
  }

  const allNavigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: PiHouse, page: 'dashboard' },
    { name: 'Obras', href: '/obras', icon: PiBuildings, page: 'obras' },
    { name: 'Kanban', href: '/kanban', icon: PiKanban, page: 'kanban' },
    { name: 'Equipes', href: '/equipes', icon: PiUsersThree, page: 'equipes' },
    { name: 'Relatórios', href: '/relatorios', icon: PiFileText, page: 'relatorios' },
    {
      name: 'Cadastros',
      icon: PiFolderPlus,
      page: 'prestadores',
      children: [
        { name: 'Prestadores', href: '/prestadores', icon: PiBriefcase, page: 'prestadores' },
        { name: 'Tipos de Prestadores', href: '/especialidades', icon: PiGear, page: 'prestadores' },
        { name: 'Produtos', href: '/produtos', icon: PiPackage, page: 'prestadores' },
        { name: 'Unidades', href: '/unidades', icon: PiScales, page: 'prestadores' },
      ]
    },
    { name: 'Usuários', href: '/usuarios', icon: PiUserGear, page: 'usuarios' },
  ];

  const filterNavigation = (items: NavigationItem[]): NavigationItem[] => {
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

  const navigation = filterNavigation(allNavigation);

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
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <img src="/logo.png" alt="Obra Vista" className="relative h-9 w-auto object-contain drop-shadow-sm" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
                Obra Vista
              </h1>
            </Link>
          </div>

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
      </header>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Light Mode Only */}
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
          <span className="font-bold text-lg text-primary">Menu</span>
          <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-black/5 rounded-xl text-foreground">
            <PiX size={20} />
          </button>
        </div>

        <nav className="p-3 lg:p-4 space-y-1.5 overflow-y-auto h-full scrollbar-hide py-4">
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

      {/* Main Content Area */}
      <main
        className={cn(
          'pt-20 px-4 pb-8 transition-all duration-300 min-h-screen',
          'lg:ml-[280px] lg:mr-4'
        )}
      >
        <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
