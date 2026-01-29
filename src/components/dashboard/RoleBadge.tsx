import { LucideIcon, Crown, UserCog, Building2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RoleInfo {
  label: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

interface UserRoles {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isDepartmentAdmin: boolean;
  isModerator: boolean;
}

interface RoleBadgeProps {
  userRoles: UserRoles;
}

function getRoleInfo(userRoles: UserRoles): RoleInfo | null {
  if (userRoles.isSuperAdmin) {
    return { 
      label: 'Super Admin', 
      icon: Crown, 
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400', 
      description: 'Full system access' 
    };
  }
  if (userRoles.isAdmin) {
    return { 
      label: 'Admin', 
      icon: UserCog, 
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400', 
      description: 'Manage issues and users' 
    };
  }
  if (userRoles.isDepartmentAdmin) {
    return { 
      label: 'Authority Admin', 
      icon: Building2, 
      color: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400', 
      description: 'Update issue status' 
    };
  }
  if (userRoles.isModerator) {
    return { 
      label: 'Moderator', 
      icon: Eye, 
      color: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400', 
      description: 'Verify reports' 
    };
  }
  return null;
}

export function RoleBadge({ userRoles }: RoleBadgeProps) {
  const roleInfo = getRoleInfo(userRoles);
  
  if (!roleInfo) return null;

  const IconComponent = roleInfo.icon;

  return (
    <Badge 
      variant="outline" 
      className={`gap-2 px-3 py-1.5 animate-in fade-in-50 duration-300 ${roleInfo.color}`}
    >
      <IconComponent className="h-4 w-4" />
      <div className="text-left">
        <div className="font-medium">{roleInfo.label}</div>
        <div className="text-xs opacity-80">{roleInfo.description}</div>
      </div>
    </Badge>
  );
}
