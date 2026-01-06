import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VerificationStatus, verificationStatusLabels, verificationStatusColors } from '@/types/issue';
import { ShieldCheck, ShieldX, ShieldAlert, ShieldQuestion, Crown, UserCog, Eye, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { AppRole } from '@/hooks/useAuth';

interface VerificationBadgeProps {
  status: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
}

const icons: Record<VerificationStatus, typeof ShieldCheck> = {
  pending_verification: ShieldQuestion,
  verified: ShieldCheck,
  invalid: ShieldX,
  spam: ShieldAlert,
};

const roleConfig: Record<string, { label: string; icon: typeof ShieldCheck; color: string }> = {
  super_admin: { label: 'Super Admin', icon: Crown, color: 'text-purple-600' },
  admin: { label: 'Admin', icon: UserCog, color: 'text-blue-600' },
  department_admin: { label: 'Authority', icon: UserCog, color: 'text-green-600' },
  moderator: { label: 'Moderator', icon: Eye, color: 'text-orange-600' },
  field_worker: { label: 'Field Worker', icon: User, color: 'text-cyan-600' },
};

interface VerifierData {
  name: string | null;
  roleLabel: string;
  roleColor: string;
}

export function VerificationBadge({ status, verifiedBy, verifiedAt }: VerificationBadgeProps) {
  const Icon = icons[status];

  const { data: verifierData } = useQuery({
    queryKey: ['verifier-badge', verifiedBy],
    queryFn: async (): Promise<VerifierData> => {
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', verifiedBy!)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', verifiedBy!),
      ]);

      const name = profileResult.data?.full_name || null;
      const roles = rolesResult.data?.map(r => r.role as AppRole) || [];

      let displayRole = 'user';
      if (roles.includes('super_admin')) displayRole = 'super_admin';
      else if (roles.includes('admin')) displayRole = 'admin';
      else if (roles.includes('department_admin')) displayRole = 'department_admin';
      else if (roles.includes('moderator')) displayRole = 'moderator';
      else if (roles.includes('field_worker')) displayRole = 'field_worker';

      const config = roleConfig[displayRole] || { label: 'User', color: 'text-muted-foreground' };

      return {
        name,
        roleLabel: config.label,
        roleColor: config.color,
      };
    },
    enabled: !!verifiedBy && status !== 'pending_verification',
  });

  const badge = (
    <Badge variant="outline" className={`gap-1 ${verificationStatusColors[status]}`}>
      <Icon className="h-3 w-3" />
      {verificationStatusLabels[status]}
    </Badge>
  );

  // If no verifier info, just show the badge
  if (!verifiedBy || status === 'pending_verification') {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="p-3 max-w-xs">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Verified by <span className={verifierData?.roleColor}>{verifierData?.roleLabel || 'Staff'}</span>
            </p>
            <p className="text-sm">{verifierData?.name || 'Unknown'}</p>
            {verifiedAt && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(verifiedAt), 'PPP \'at\' p')}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
