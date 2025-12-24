import { Badge } from '@/components/ui/badge';
import { IssuePriority, priorityLabels } from '@/types/issue';
import { ArrowDown, Minus, ArrowUp } from 'lucide-react';

interface PriorityBadgeProps {
  priority: IssuePriority;
}

const priorityConfig = {
  low: {
    variant: 'priorityLow' as const,
    icon: ArrowDown,
  },
  medium: {
    variant: 'priorityMedium' as const,
    icon: Minus,
  },
  high: {
    variant: 'priorityHigh' as const,
    icon: ArrowUp,
  },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {priorityLabels[priority]}
    </Badge>
  );
}
