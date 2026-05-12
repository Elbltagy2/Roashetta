import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  Globe,
  Stethoscope,
  UserCog,
  Wallet,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  key: string;
  icon: React.ElementType;
  path: string;
  doctorOnly?: boolean;
}

const navItems: NavItem[] = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'patients', icon: Users, path: '/patients' },
  { key: 'queue', icon: ClipboardList, path: '/queue' },
  { key: 'expenses', icon: Wallet, path: '/expenses' },
  { key: 'analytics', icon: BarChart3, path: '/analytics', doctorOnly: true },
  { key: 'assistants', icon: UserCog, path: '/assistants', doctorOnly: true },
  { key: 'settings', icon: Settings, path: '/settings' },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { t, language, setLanguage, direction } = useLanguage();
  const { user, logout, isDoctor } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (item.doctorOnly && !isDoctor) return false;
    return true;
  });

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground text-lg">
              {language === 'ar' ? 'عيادتي' : 'My Clinic'}
            </h1>
            <p className="text-xs text-sidebar-foreground/70">
              {user?.clinicName || (language === 'ar' ? 'مساعد' : 'Assistant')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.key}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{t(`nav.${item.key}`)}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="px-4 py-3">
          <p className="font-semibold text-sidebar-foreground">{user?.name}</p>
          <p className="text-sm text-sidebar-foreground/70">
            {isDoctor
              ? (user?.specialization || (language === 'ar' ? 'طبيب' : 'Doctor'))
              : (language === 'ar' ? 'مساعد' : 'Assistant')}
          </p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          {t('nav.logout')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={cn('min-h-screen bg-background', direction === 'rtl' && 'rtl')}>
      {/* Desktop Sidebar */}
      <aside className="fixed top-0 bottom-0 start-0 hidden lg:block w-72 gradient-primary">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border h-16 px-4 flex items-center justify-between card-shadow">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side={direction === 'rtl' ? 'right' : 'left'} className="p-0 w-72 gradient-primary border-0">
            <NavContent />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-primary" />
          <span className="font-bold text-foreground">
            {language === 'ar' ? 'عيادتي' : 'My Clinic'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={toggleLanguage}>
            <Globe className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn('lg:ms-72 min-h-screen', 'pt-16 lg:pt-0')}>
        {/* Top Bar */}
        <div className="hidden lg:flex h-16 px-8 items-center justify-between border-b border-border bg-card">
          <div>
            {/* Breadcrumb could go here */}
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              {language === 'ar' ? 'English' : 'العربية'}
            </Button>
          </div>
        </div>

        {/* Page Content */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 lg:p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardLayout;
