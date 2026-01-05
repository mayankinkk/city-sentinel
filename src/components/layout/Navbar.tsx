import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  MapPin, 
  FileText, 
  BarChart3, 
  LogIn, 
  LogOut, 
  Plus,
  Menu,
  X,
  Shield,
  User,
  Crown,
  UserCog,
  Eye,
  Building2
} from 'lucide-react';
import citySentinelLogo from '@/assets/city-sentinel-logo.png';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, userRoles, signOut } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check if user has any dashboard access
  const hasDashboardAccess = userRoles.isSuperAdmin || userRoles.isAdmin || userRoles.isDepartmentAdmin || userRoles.isModerator;

  const navItems = [
    { path: '/map', label: 'Map', icon: MapPin },
    { path: '/issues', label: 'Issues', icon: FileText },
    ...(hasDashboardAccess ? [{ path: '/dashboard', label: 'Dashboard', icon: BarChart3 }] : []),
    ...(userRoles.isSuperAdmin ? [{ path: '/admin/users', label: 'Users', icon: Shield }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  // Get role badge info
  const getRoleBadge = () => {
    if (userRoles.isSuperAdmin) return { label: 'Super Admin', icon: Crown, color: 'bg-purple-500/10 text-purple-600' };
    if (userRoles.isAdmin) return { label: 'Admin', icon: UserCog, color: 'bg-blue-500/10 text-blue-600' };
    if (userRoles.isDepartmentAdmin) return { label: 'Authority', icon: Building2, color: 'bg-green-500/10 text-green-600' };
    if (userRoles.isModerator) return { label: 'Moderator', icon: Eye, color: 'bg-orange-500/10 text-orange-600' };
    return null;
  };

  const roleBadge = getRoleBadge();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src={citySentinelLogo} 
              alt="City Sentinel Logo" 
              className="h-10 w-10 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-bold gradient-text">City Sentinel</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}>
                <Button
                  variant={isActive(path) ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    "gap-2",
                    isActive(path) && "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Auth & Report Button */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <>
                <NotificationBell />
                <Link to="/report">
                  <Button variant="hero" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Report Issue
                  </Button>
                </Link>
                {roleBadge && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    roleBadge.color
                  )}>
                    <roleBadge.icon className="h-3 w-3" />
                    {roleBadge.label}
                  </div>
                )}
                <Link to="/profile">
                  <Button variant="ghost" size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} to={path} onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant={isActive(path) ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              ))}
              {roleBadge && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                  roleBadge.color
                )}>
                  <roleBadge.icon className="h-4 w-4" />
                  {roleBadge.label}
                </div>
              )}
              <div className="h-px bg-border/50 my-2" />
              {user ? (
                <>
                  <Link to="/report" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="hero" className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      Report Issue
                    </Button>
                  </Link>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={() => { signOut(); setIsMenuOpen(false); }} className="w-full justify-start gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="default" className="w-full gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
