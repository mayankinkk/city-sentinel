import { Badge } from '@/components/ui/badge';
import { IssueStatus, statusLabels } from '@/types/issue';
import { Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: IssueStatus;
}

const statusConfig: Record<IssueStatus, { variant: 'pending' | 'inProgress' | 'resolved' | 'secondary'; icon: any }> = {
  pending: {
    variant: 'pending',
    icon: Clock,
  },
  in_progress: {
    variant: 'inProgress',
    icon: Loader2,
  },
  resolved: {
    variant: 'resolved',
    icon: CheckCircle2,
  },
  withdrawn: {
    variant: 'secondary',
    icon: XCircle,
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
