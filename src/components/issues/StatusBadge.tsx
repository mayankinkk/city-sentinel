import { Badge } from '@/components/ui/badge';
import { IssueStatus, statusLabels } from '@/types/issue';
import { Clock, Loader2, CheckCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: IssueStatus;
}

const statusConfig = {
  pending: {
    variant: 'pending' as const,
    icon: Clock,
  },
  in_progress: {
    variant: 'inProgress' as const,
    icon: Loader2,
  },
  resolved: {
    variant: 'resolved' as const,
    icon: CheckCircle,
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className={`h-3 w-3 ${status === 'in_progress' ? 'animate-spin' : ''}`} />
      {statusLabels[status]}
    </Badge>
  );
}
