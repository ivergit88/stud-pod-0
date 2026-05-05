import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { LogOut, User, Bell, Briefcase, HelpCircle, LayoutDashboard, PlusCircle, Users, Eye, Calendar, Search } from 'lucide-react';
import {
  AccessibilityPanel,
  applyAccessibilitySettings,
  clearAccessibilitySettings,
  loadAccessibilitySettings,
} from './AccessibilityPanel';
import { ChatWidget } from './ChatWidget';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [highContrastEnabled, setHighContrastEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem('stud-pod-a11y-enabled') === 'true';
  });
  const [a11yPanelOpen, setA11yPanelOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('stud-pod-a11y-enabled', highContrastEnabled ? 'true' : 'false');
    }

    if (highContrastEnabled) {
      applyAccessibilitySettings(loadAccessibilitySettings());
      return;
    }

    clearAccessibilitySettings();
  }, [highContrastEnabled]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const unreadNotificationsCount = user 
    ? notifications.filter(n => n.userId === user.id && !n.read).length 
    : 0;

  const openAccessibilityPanel = () => {
    if (!highContrastEnabled) {
      setHighContrastEnabled(true);
    }

    setA11yPanelOpen(true);
  };

  const disableAccessibilityMode = () => {
    setA11yPanelOpen(false);
    setHighContrastEnabled(false);
  };

  return (
    <div className="relative flex min-h-screen max-w-full flex-col overflow-x-hidden bg-gray-50 text-gray-900 font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-blue-700 focus:shadow-lg"
      >
        Перейти к содержанию
      </a>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex min-h-14 items-center gap-1.5 py-2 sm:min-h-16 sm:gap-2">
            <div className="flex min-w-0 flex-1 items-center">
              <Link
                to="/"
                aria-label="Студенческий подряд, главная страница"
                className="flex min-w-0 max-w-full items-center gap-1.5 sm:gap-3"
              >
                <span className="site-logo-mark flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-950 ring-1 ring-blue-100 sm:h-12 sm:w-12">
                  <img
                    src="/logo-sp.png?v=6"
                    alt=""
                    className="site-logo-image h-full w-full object-contain"
                  />
                </span>
                <span className="site-logo-title flex-shrink-0 whitespace-nowrap text-[13px] font-bold leading-tight tracking-[-0.02em] text-blue-700 sm:text-2xl sm:tracking-normal">
                  Студенческий подряд
                </span>
              </Link>
            </div>
            <div className="flex shrink-0 items-center space-x-1 sm:space-x-4">
              <button 
                onClick={() => {
                  if (a11yPanelOpen) {
                    setA11yPanelOpen(false);
                  } else {
                    openAccessibilityPanel();
                  }
                }}
                className={`flex items-center rounded-xl px-2 py-2 text-sm font-medium transition-colors sm:px-3 ${
                  highContrastEnabled
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-blue-700'
                }`}
                title={highContrastEnabled ? 'Настройки доступности' : 'Версия для слабовидящих'}
                aria-label={highContrastEnabled ? 'Настройки доступности' : 'Версия для слабовидящих'}
                aria-expanded={a11yPanelOpen}
              >
                <Eye className="h-5 w-5 sm:mr-1" />
                <span className="ml-1 hidden sm:inline">
                  {highContrastEnabled ? 'Настройки доступности' : 'Версия для слабовидящих'}
                </span>
              </button>
              {user ? (
                <>
                  <Link
                    to="/уведомления"
                    className="text-gray-500 hover:text-gray-700 relative p-2"
                    aria-label={
                      unreadNotificationsCount > 0
                        ? `Уведомления, непрочитано: ${unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}`
                        : 'Уведомления'
                    }
                  >
                    <Bell className="h-6 w-6" />
                    {unreadNotificationsCount > 0 && (
                      <span className="a11y-notification-count a11y-force-accent absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border border-white bg-red-500 px-1.5 text-[11px] font-extrabold leading-none text-white shadow-sm">
                        {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                      </span>
                    )}
                  </Link>
                  <div className="flex items-center space-x-2">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-medium text-gray-900">{user.firstName || user.name} {user.lastName}</div>
                      <div className="text-xs text-gray-500">{user.role === 'student' ? 'Студент' : 'Организация'}</div>
                    </div>
                    <button onClick={() => void handleLogout()} className="p-2 text-gray-500 hover:text-red-600 transition-colors" title="Выйти">
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Link to="/вход" className="rounded-md px-2 py-2 text-xs font-medium text-gray-600 transition-colors hover:text-blue-700 sm:px-3 sm:text-base">
                    Войти
                  </Link>
                  <Link to="/регистрация" className="whitespace-nowrap rounded-md bg-blue-700 px-2.5 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-800 sm:px-4 sm:text-base">
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {a11yPanelOpen && (
        <AccessibilityPanel
          onClose={() => setA11yPanelOpen(false)}
          onDisable={disableAccessibilityMode}
        />
      )}

      <div className="app-shell-content flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 md:pb-8 pb-36">
        {user && (
          <aside className="hidden w-72 flex-shrink-0 pr-6 md:block">
            <nav className="space-y-1">
              {user.role === 'student' && (
                <>
                  <NavLink to="/студент" icon={<LayoutDashboard />} label="Личный кабинет" activeWhen={(pathname) => pathname === '/студент'} />
                  <NavLink to="/задачи" icon={<Briefcase />} label="Каталог задач" activeWhen={(pathname) => pathname.startsWith('/задачи')} />
                  <NavLink to="/сокомандники" icon={<Search />} label="Сокомандники" activeWhen={(pathname) => pathname.startsWith('/сокомандники')} />
                  <NavLink to="/портфолио" icon={<User />} label="Моё портфолио" activeWhen={(pathname) => pathname.startsWith('/портфолио')} />
                  <NavLink to="/мероприятия" icon={<Users />} label="Офлайн мероприятия" activeWhen={(pathname) => pathname.startsWith('/мероприятия')} />
                </>
              )}
              {user.role === 'organization' && (
                <>
                  <NavLink to="/организация" icon={<LayoutDashboard />} label="Кабинет организации" activeWhen={(pathname) => pathname === '/организация'} />
                  <NavLink to="/организация/задачи/новая" icon={<PlusCircle />} label="Создать задачу" activeWhen={(pathname) => pathname === '/организация/задачи/новая'} />
                  <NavLink to="/организация/мероприятия/новое" icon={<Calendar />} label="Создать мероприятие" activeWhen={(pathname) => pathname.startsWith('/организация/мероприятия/')} />
                  <NavLink
                    to="/организация/задачи"
                    icon={<Briefcase />}
                    label="Управление публикациями"
                    activeWhen={(pathname) =>
                      pathname === '/организация/задачи' ||
                      (pathname.startsWith('/организация/задачи/') && pathname !== '/организация/задачи/новая')
                    }
                  />
                </>
              )}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <NavLink to="/помощь" icon={<HelpCircle />} label="Помощь" activeWhen={(pathname) => pathname.startsWith('/помощь')} />
              </div>
            </nav>
          </aside>
        )}
        <main id="main-content" className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
          <div className="flex justify-around items-center h-16">
            {user.role === 'student' && (
              <>
                <MobileNavLink to="/студент" icon={<LayoutDashboard />} label="Кабинет" activeWhen={(pathname) => pathname === '/студент'} />
                <MobileNavLink to="/задачи" icon={<Briefcase />} label="Задачи" activeWhen={(pathname) => pathname.startsWith('/задачи')} />
                <MobileNavLink to="/сокомандники" icon={<Search />} label="Команда" activeWhen={(pathname) => pathname.startsWith('/сокомандники')} />
                <MobileNavLink to="/портфолио" icon={<User />} label="Портфолио" activeWhen={(pathname) => pathname.startsWith('/портфолио')} />
                <MobileNavLink to="/мероприятия" icon={<Users />} label="События" activeWhen={(pathname) => pathname.startsWith('/мероприятия')} />
              </>
            )}
            {user.role === 'organization' && (
              <>
                <MobileNavLink to="/организация" icon={<LayoutDashboard />} label="Обзор" activeWhen={(pathname) => pathname === '/организация'} />
                <MobileNavLink to="/организация/задачи/новая" icon={<PlusCircle />} label="Задача" activeWhen={(pathname) => pathname === '/организация/задачи/новая'} />
                <MobileNavLink to="/организация/мероприятия/новое" icon={<Calendar />} label="Событие" activeWhen={(pathname) => pathname.startsWith('/организация/мероприятия/')} />
                <MobileNavLink
                  to="/организация/задачи"
                  icon={<Briefcase />}
                  label="Публикации"
                  activeWhen={(pathname) =>
                    pathname === '/организация/задачи' ||
                    (pathname.startsWith('/организация/задачи/') && pathname !== '/организация/задачи/новая')
                  }
                />
              </>
            )}
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-gray-200 mt-auto hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start space-x-6 md:order-2">
              <Link to="/конфиденциальность" className="text-sm text-gray-500 hover:text-gray-900">
                Политика конфиденциальности
              </Link>
            </div>
            <div className="mt-4 md:mt-0 md:order-1">
              <p className="max-w-4xl text-center text-xs leading-5 text-gray-500 md:text-left">
                &copy; 2026 Студенческий подряд. Проект реализуется в рамках трека «Делаю» Всероссийского студенческого проекта «Твой Ход» при поддержке Автономной некоммерческой организации высшего образования «Университет Неймарк».
              </p>
            </div>
          </div>
        </div>
      </footer>

      {location.pathname !== '/помощь' && <ChatWidget />}
    </div>
  );
};

const NavLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  activeWhen: (pathname: string) => boolean;
}> = ({ to, icon, label, activeWhen }) => {
  const location = useLocation();
  const isActive = activeWhen(location.pathname);

  return (
    <Link
      to={to}
      className={`group flex items-start px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
      }`}
    >
      <span
        className={`mr-3 mt-0.5 flex-shrink-0 h-5 w-5 flex items-center justify-center transition-colors ${
          isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 whitespace-normal break-words leading-tight">{label}</span>
    </Link>
  );
};

const MobileNavLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  activeWhen: (pathname: string) => boolean;
}> = ({ to, icon, label, activeWhen }) => {
  const location = useLocation();
  const isActive = activeWhen(location.pathname);

  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
        isActive ? 'text-blue-700' : 'text-gray-500 hover:text-blue-700'
      }`}
    >
      <span className={`h-6 w-6 mb-1 flex items-center justify-center transition-transform ${isActive ? 'scale-110' : ''}`}>
        {icon}
      </span>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
};
