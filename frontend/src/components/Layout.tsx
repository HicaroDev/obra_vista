import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  PiList, PiX, PiSun, PiMoon, PiSignOut,
  PiHouse, PiUsersThree, PiBuildings, PiKanban,
  PiBriefcase, PiFileText, PiUserGear, PiGear,
  PiCaretDown, PiCaretRight, PiFolderPlus, PiPackage, PiScales
} from 'react-icons/pi';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { canAccessPage } from '../lib/permissions';
import { cn } from '../utils/cn';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const { theme, toggleTheme } = useThemeStore();
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

  // Filtrar navegação recursivamente
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
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-50 shadow-sm">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              {sidebarOpen ? <PiX size={20} /> : <PiList size={20} />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Obra Vista" className="h-8 w-auto object-contain" />
              <h1 className="text-lg md:text-xl font-bold text-primary block">Obra Vista</h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? <PiSun size={20} /> : <PiMoon size={20} />}
            </button>

            <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 bg-accent rounded-lg">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {user?.nome.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium hidden md:block">{user?.nome}</span>
            </div>

            <button
              onClick={logout}
              className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
              title="Sair"
            >
              <PiSignOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Overlay para mobile quando sidebar está aberto */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 lg:top-14 bottom-0 bg-background border-r border-border transition-all duration-300 z-[60] lg:z-40',
          'w-64 shadow-2xl lg:shadow-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
          <span className="font-bold text-lg">Menu</span>
          <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-accent rounded-lg">
            <PiX size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)] lg:max-h-none">
          {navigation.map((item) => {
            const Icon = item.icon;

            // Renderização de Item com Submenu
            if (item.children) {
              const isOpen = openMenus.includes(item.name);
              const isActiveParent = item.children.some(child => child.href === location.pathname);

              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors group',
                      isActiveParent ? 'bg-accent/50 text-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} className={isActiveParent ? 'text-primary' : 'group-hover:text-primary'} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {isOpen ? <PiCaretDown size={16} /> : <PiCaretRight size={16} />}
                  </button>

                  {isOpen && (
                    <div className="pl-4 space-y-1 border-l-2 border-border ml-4">
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
                              'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm',
                              isChildActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )}
                          >
                            <ChildIcon size={18} />
                            <span>{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Renderização de Item Simples
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href!}
                onClick={() => {
                  // Fecha sidebar em mobile ao clicar em um link
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                <Icon size={20} className={isActive ? '' : 'text-muted-foreground group-hover:text-primary'} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 p-4 bg-accent rounded-lg">
          <p className="text-xs text-muted-foreground">
            Logado como <span className="font-semibold text-foreground">{user?.tipo}</span>
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'pt-14 transition-all duration-300 min-h-screen',
          'lg:ml-64' // Sempre com margem em desktop
        )}
      >
        {children}
      </main>
    </div>
  );
}
