import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Clock, 
  PlayCircle, 
  CheckCircle, 
  XCircle,
  User,
  Crown,
  UserCog,
  Eye,
  Building2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_by_name: string | null;
  changed_by_role: string | null;
  notes: string | null;
  created_at: string;
}

interface StatusTimelineProps {
  issueId: string;
  createdAt: string;
}

const statusConfig: Record<string, { 
  label: string; 
  icon: typeof Clock; 
  color: string;
  bgColor: string;
}> = {
  pending: { 
    label: 'Pending', 
    icon: Clock, 
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500'
  },
  in_progress: { 
    label: 'In Progress', 
    icon: PlayCircle, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-500'
  },
  resolved: { 
    label: 'Resolved', 
    icon: CheckCircle, 
    color: 'text-green-600',
    bgColor: 'bg-green-500'
  },
  withdrawn: { 
    label: 'Withdrawn', 
    icon: XCircle, 
    color: 'text-muted-foreground',
    bgColor: 'bg-muted-foreground'
  },
};

const roleIcons: Record<string, typeof Crown> = {
  super_admin: Crown,
  admin: UserCog,
  department_admin: Building2,
  moderator: Eye,
  user: User,
};

const roleColors: Record<string, string> = {
  super_admin: 'text-purple-600',
  admin: 'text-blue-600',
  department_admin: 'text-green-600',
  moderator: 'text-orange-600',
  user: 'text-muted-foreground',
};

export function StatusTimeline({ issueId, createdAt }: StatusTimelineProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['status-history', issueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issue_status_history')
        .select('*')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as StatusHistoryEntry[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading timeline...</span>
      </div>
    );
  }

  // Define unified type for timeline events
  type TimelineEvent = {
    id: string;
    type: 'created' | 'status_change';
    status: string;
    oldStatus?: string | null;
    timestamp: string;
    title: string;
    description?: string | null;
    changedBy?: string | null;
    changedByRole?: string | null;
  };

  // Build timeline including the initial creation
  const timelineEvents: TimelineEvent[] = [
    {
      id: 'created',
      type: 'created',
      status: 'pending',
      timestamp: createdAt,
      title: 'Issue Reported',
      description: 'Issue was created and submitted for review',
    },
    ...(history || []).map((entry): TimelineEvent => ({
      id: entry.id,
      type: 'status_change',
      status: entry.new_status,
      oldStatus: entry.old_status,
      timestamp: entry.created_at,
      title: `Status changed to ${statusConfig[entry.new_status]?.label || entry.new_status}`,
      description: entry.notes,
      changedBy: entry.changed_by_name,
      changedByRole: entry.changed_by_role,
    })),
  ];

  return (
    <ScrollArea className="h-[350px] pr-4">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border" />
        
        <div className="space-y-6">
          {timelineEvents.map((event, index) => {
            const config = statusConfig[event.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            const RoleIcon = roleIcons[event.changedByRole || 'user'] || User;
            const roleColor = roleColors[event.changedByRole || 'user'] || 'text-muted-foreground';
            
            return (
              <div key={event.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div 
                  className={cn(
                    "relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                    config.bgColor
                  )}
                >
                  <StatusIcon className="h-3.5 w-3.5 text-white" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("font-medium", config.color)}>
                      {event.title}
                    </span>
                    {event.oldStatus && (
                      <Badge variant="outline" className="text-xs">
                        from {statusConfig[event.oldStatus]?.label || event.oldStatus}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <time dateTime={event.timestamp}>
                      {format(new Date(event.timestamp), 'PPP \'at\' p')}
                    </time>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}</span>
                  </div>
                  
                  {event.type === 'status_change' && event.changedBy && (
                    <div className="flex items-center gap-1.5 mt-2 text-sm">
                      <RoleIcon className={cn("h-3.5 w-3.5", roleColor)} />
                      <span className={roleColor}>
                        {event.changedByRole?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'User'}
                      </span>
                      <span className="text-foreground">{event.changedBy}</span>
                    </div>
                  )}
                  
                  {event.description && (
                    <p className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
