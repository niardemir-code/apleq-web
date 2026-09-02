import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Plus, 
  Sun, 
  Moon, 
  LogOut, 
  LogIn, 
  Settings,
  Bell
} from 'lucide-react';

interface NavbarProps {
  onNewSubscription: () => void;
  onOpenSettings: () => void;
  onOpenNotifications?: () => void;
  subscriptionsCount: number;
  unreadNotificationsCount?: number;
  totalNotificationsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewSubscription,
  onOpenSettings,
  onOpenNotifications,
  subscriptionsCount,
  unreadNotificationsCount = 0,
  totalNotificationsCount = 0,
}) => {
  const { user, signIn, signOut, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const hasUnread = unreadNotificationsCount > 0;
  const hasNotifications = totalNotificationsCount > 0;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-card/90 border-b border-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <img
            src={isDark ? '/apleq_lockup_web_oscuro.png' : '/apleq_lockup_web_claro.png'}
            alt="Apleq"
            className="h-14 w-auto object-contain select-none"
          />
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Notifications Bell button (Illuminated when alarms/notifs exist) */}
          <button
            id="btn-nav-notifications"
            onClick={onOpenNotifications}
            type="button"
            className={`relative p-2 rounded-xl border transition-all cursor-pointer shadow-xs ${
              hasUnread
                ? 'bg-amber-500/15 dark:bg-amber-400/20 border-amber-500/50 text-amber-600 dark:text-amber-300 ring-2 ring-amber-500/30 shadow-md shadow-amber-500/10 hover:bg-amber-500/25'
                : hasNotifications
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20'
                : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border'
            }`}
            title={
              hasUnread
                ? `${unreadNotificationsCount} aviso(s) de cobro o alarma(s) sin leer`
                : hasNotifications
                ? `${totalNotificationsCount} notificación(es) activa(s)`
                : 'Centro de notificaciones y alarmas'
            }
            aria-label="Notificaciones"
          >
            <Bell className={`w-4 h-4 ${hasUnread ? 'animate-bounce stroke-[2.5]' : ''}`} />

            {/* Glowing Pulse indicator when unread alarms exist */}
            {hasUnread && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-black shadow-sm ring-2 ring-card animate-pulse">
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </span>
            )}

            {/* Subtle dot when notifications exist but all read */}
            {!hasUnread && hasNotifications && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 ring-1 ring-card" />
            )}
          </button>

          {/* Quick theme toggle button */}
          <button
            id="btn-nav-quick-theme"
            onClick={toggleTheme}
            type="button"
            className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-all cursor-pointer shadow-xs"
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Alternar tema"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-blue-500" />
            )}
          </button>

          {/* Settings button */}
          <button
            id="btn-nav-settings"
            onClick={onOpenSettings}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-muted/60 hover:bg-muted border border-border text-foreground transition-all cursor-pointer shadow-xs"
            title="Configuración general, plataformas y copia JSON"
            aria-label="Configuración"
          >
            <Settings className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">Configuración</span>
          </button>

          {/* Add subscription CTA */}
          <button
            id="btn-nav-new-sub"
            onClick={onNewSubscription}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white active:scale-98 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva <span className="hidden sm:inline">Suscripción</span></span>
          </button>

          {/* User Profile / Google Sign-in */}
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-border">
              <div className="relative group">
                <div className="flex items-center gap-2.5 cursor-pointer bg-muted/70 border border-border rounded-full pl-1.5 pr-3 py-1 hover:border-blue-500/50 transition-colors">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Usuario'}
                      className="w-7 h-7 rounded-full bg-muted object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-foreground max-w-[100px] truncate hidden sm:inline">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>

                {/* Dropdown Menu on hover/click */}
                <div className="absolute right-0 mt-1.5 w-56 p-2 rounded-2xl bg-card border border-border shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-bold text-foreground truncate">
                      {user.displayName || 'Usuario'}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="px-3 py-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {subscriptionsCount} suscripción(es) activas
                  </div>
                  <button
                    id="btn-user-logout"
                    onClick={signOut}
                    type="button"
                    className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              id="btn-user-signin"
              onClick={signIn}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-muted border border-border text-foreground hover:border-blue-500/50 shadow-xs transition-all cursor-pointer"
              title="Iniciar sesión con Google para sincronizar tus suscripciones"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Conectar Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
