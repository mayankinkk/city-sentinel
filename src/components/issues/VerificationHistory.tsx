import { useVerificationHistory, VerificationHistoryEntry } from '@/hooks/useVerificationHistory';
import { VerificationBadge } from './VerificationBadge';
import { VerificationStatus } from '@/types/issue';
import { format } from 'date-fns';
import { History, Loader2, Crown, UserCog, Eye, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VerificationHistoryProps {
  issueId: string;
}

const roleIcons: Record<string, typeof Crown> = {
  super_admin: Crown,
  admin: UserCog,
  department_admin: UserCog,
  moderator: Eye,
  field_worker: User,
};

const roleColors: Record<string, string> = {
  super_admin: 'text-purple-600',
  admin: 'text-blue-600',
  department_admin: 'text-green-600',
  moderator: 'text-orange-600',
  field_worker: 'text-cyan-600',
};

export function VerificationHistory({ issueId }: VerificationHistoryProps) {
  const { data: history, isLoading } = useVerificationHistory(issueId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading history...</span>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No verification history yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {history.map((entry, index) => {
          const RoleIcon = roleIcons[entry.verifier_role || ''] || User;
          const roleColor = roleColors[entry.verifier_role || ''] || 'text-muted-foreground';
          
          return (
            <div 
              key={entry.id} 
              className={`relative pl-6 pb-4 ${index !== history.length - 1 ? 'border-l-2 border-border ml-2' : 'ml-2'}`}
            >
              {/* Timeline dot */}
              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-background bg-primary" />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <VerificationBadge 
                    status={entry.verification_status as VerificationStatus}
                  />
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(entry.created_at), 'PPP \'at\' p')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <RoleIcon className={`h-4 w-4 ${roleColor}`} />
                  <span className={`font-medium ${roleColor}`}>
                    {entry.verifier_role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'User'}
                  </span>
                  <span className="text-foreground">
                    {entry.verifier_name || 'Unknown'}
                  </span>
                </div>
                
                {entry.verification_notes && (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                    {entry.verification_notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
