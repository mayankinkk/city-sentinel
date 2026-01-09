import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, Crown, UserCog, Eye, User } from 'lucide-react';
import { format } from 'date-fns';
import { AppRole } from '@/hooks/useAuth';

interface VerifierInfoProps {
  verifiedBy: string;
  verifiedAt?: string;
}

interface VerifierData {
  name: string | null;
  role: string;
  roleLabel: string;
  roleIcon: typeof ShieldCheck;
  roleColor: string;
}

const roleConfig: Record<string, { label: string; icon: typeof ShieldCheck; color: string }> = {
  super_admin: { label: 'Super Admin', icon: Crown, color: 'text-purple-600' },
  admin: { label: 'Admin', icon: UserCog, color: 'text-blue-600' },
  department_admin: { label: 'Authority', icon: UserCog, color: 'text-green-600' },
  moderator: { label: 'Moderator', icon: Eye, color: 'text-orange-600' },
  field_worker: { label: 'Field Worker', icon: User, color: 'text-cyan-600' },
};

export function VerifierInfo({ verifiedBy, verifiedAt }: VerifierInfoProps) {
  const { data: verifierData, isLoading } = useQuery({
    queryKey: ['verifier', verifiedBy],
    queryFn: async (): Promise<VerifierData> => {
      // Fetch profile (using public view for non-PII) and roles in parallel
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles_public')
          .select('full_name')
          .eq('user_id', verifiedBy)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', verifiedBy),
      ]);

      const name = profileResult.data?.full_name || null;
      const roles = rolesResult.data?.map(r => r.role as AppRole) || [];

      // Determine the highest role for display
      let displayRole = 'user';
      if (roles.includes('super_admin')) displayRole = 'super_admin';
      else if (roles.includes('admin')) displayRole = 'admin';
      else if (roles.includes('department_admin')) displayRole = 'department_admin';
      else if (roles.includes('moderator')) displayRole = 'moderator';
      else if (roles.includes('field_worker')) displayRole = 'field_worker';

      const config = roleConfig[displayRole] || { label: 'User', icon: User, color: 'text-muted-foreground' };

      return {
        name,
        role: displayRole,
        roleLabel: config.label,
        roleIcon: config.icon,
        roleColor: config.color,
      };
    },
    enabled: !!verifiedBy,
  });

  if (isLoading) {
    return (
      <p className="text-xs text-muted-foreground mt-2 animate-pulse">
        Loading verifier info...
      </p>
    );
  }

  if (!verifierData) {
    return null;
  }

  const Icon = verifierData.roleIcon;
  const displayName = verifierData.name || 'Unknown';

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <div className="flex items-center gap-2 text-sm">
        <Icon className={`h-4 w-4 ${verifierData.roleColor}`} />
        <span className="text-muted-foreground">Verified by</span>
        <span className={`font-medium ${verifierData.roleColor}`}>
          {verifierData.roleLabel}
        </span>
        <span className="text-foreground font-medium">
          {displayName}
        </span>
      </div>
      {verifiedAt && (
        <p className="text-xs text-muted-foreground mt-1 ml-6">
          on {format(new Date(verifiedAt), 'PPP \'at\' p')}
        </p>
      )}
    </div>
  );
}
